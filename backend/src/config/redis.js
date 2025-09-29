const Redis = require('ioredis')
const logger = require('./logger')

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  family: 4,
  keepAlive: 30000
}

// Create Redis client
const redis = new Redis(redisConfig)

// Redis event handlers
redis.on('connect', () => {
  logger.info('Redis connection established', {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db
  })
})

redis.on('ready', () => {
  logger.info('Redis client ready')
})

redis.on('error', (error) => {
  logger.error('Redis connection error', {
    error: error.message,
    host: redisConfig.host,
    port: redisConfig.port
  })
})

redis.on('close', () => {
  logger.warn('Redis connection closed')
})

redis.on('reconnecting', (delay) => {
  logger.info('Redis reconnecting', { delay: `${delay}ms` })
})

redis.on('end', () => {
  logger.info('Redis connection ended')
})

// Test Redis connection
const testConnection = async () => {
  try {
    await redis.ping()
    logger.info('Redis connection test successful')
    return true
  } catch (error) {
    logger.error('Redis connection test failed', { error: error.message })
    return false
  }
}

// Cache helper functions
const cache = {
  // Get value from cache
  get: async (key) => {
    try {
      const value = await redis.get(key)
      if (value) {
        logger.debug('Cache hit', { key })
        return JSON.parse(value)
      }
      logger.debug('Cache miss', { key })
      return null
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message })
      return null
    }
  },

  // Set value in cache with optional TTL
  set: async (key, value, ttlSeconds = 3600) => {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds > 0) {
        await redis.setex(key, ttlSeconds, serialized)
      } else {
        await redis.set(key, serialized)
      }
      logger.debug('Cache set', { key, ttl: ttlSeconds })
      return true
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message })
      return false
    }
  },

  // Delete from cache
  del: async (key) => {
    try {
      const result = await redis.del(key)
      logger.debug('Cache delete', { key, deleted: result > 0 })
      return result > 0
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message })
      return false
    }
  },

  // Delete multiple keys
  delPattern: async (pattern) => {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        const result = await redis.del(...keys)
        logger.debug('Cache pattern delete', { pattern, keysDeleted: result })
        return result
      }
      return 0
    } catch (error) {
      logger.error('Cache pattern delete error', { pattern, error: error.message })
      return 0
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Cache exists error', { key, error: error.message })
      return false
    }
  },

  // Set expiration on existing key
  expire: async (key, ttlSeconds) => {
    try {
      const result = await redis.expire(key, ttlSeconds)
      logger.debug('Cache expire set', { key, ttl: ttlSeconds, success: result === 1 })
      return result === 1
    } catch (error) {
      logger.error('Cache expire error', { key, error: error.message })
      return false
    }
  },

  // Get remaining TTL
  ttl: async (key) => {
    try {
      const result = await redis.ttl(key)
      return result
    } catch (error) {
      logger.error('Cache TTL error', { key, error: error.message })
      return -1
    }
  },

  // Increment counter
  incr: async (key, amount = 1) => {
    try {
      const result = await redis.incrby(key, amount)
      logger.debug('Cache increment', { key, amount, newValue: result })
      return result
    } catch (error) {
      logger.error('Cache increment error', { key, error: error.message })
      return 0
    }
  },

  // Set with expiration if not exists
  setnx: async (key, value, ttlSeconds = 3600) => {
    try {
      const serialized = JSON.stringify(value)
      const result = await redis.set(key, serialized, 'EX', ttlSeconds, 'NX')
      const success = result === 'OK'
      logger.debug('Cache setnx', { key, ttl: ttlSeconds, success })
      return success
    } catch (error) {
      logger.error('Cache setnx error', { key, error: error.message })
      return false
    }
  }
}

// Session-specific cache functions
const sessionCache = {
  // Store user session
  setSession: async (sessionId, userId, sessionData, ttlSeconds = 3600) => {
    const key = `session:${sessionId}`
    const data = {
      userId,
      ...sessionData,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    }
    return await cache.set(key, data, ttlSeconds)
  },

  // Get user session
  getSession: async (sessionId) => {
    const key = `session:${sessionId}`
    const session = await cache.get(key)
    if (session) {
      // Update last accessed time
      session.lastAccessed = new Date().toISOString()
      await cache.set(key, session, await cache.ttl(key))
    }
    return session
  },

  // Delete user session
  deleteSession: async (sessionId) => {
    const key = `session:${sessionId}`
    return await cache.del(key)
  },

  // Delete all sessions for a user
  deleteUserSessions: async (userId) => {
    const pattern = `session:*`
    const keys = await redis.keys(pattern)
    let deletedCount = 0

    for (const key of keys) {
      const session = await cache.get(key)
      if (session && session.userId === userId) {
        await cache.del(key)
        deletedCount++
      }
    }

    logger.info('User sessions deleted', { userId, deletedCount })
    return deletedCount
  }
}

// Rate limiting cache functions
const rateLimitCache = {
  // Check and increment rate limit counter
  checkRateLimit: async (key, windowMs, maxRequests) => {
    try {
      const current = await redis.incr(key)
      if (current === 1) {
        await redis.pexpire(key, windowMs)
      }

      const ttl = await redis.pttl(key)
      const remaining = Math.max(0, maxRequests - current)
      const resetTime = new Date(Date.now() + ttl)

      logger.debug('Rate limit check', {
        key,
        current,
        remaining,
        resetTime,
        blocked: current > maxRequests
      })

      return {
        allowed: current <= maxRequests,
        current,
        remaining,
        resetTime,
        retryAfter: current > maxRequests ? Math.ceil(ttl / 1000) : null
      }
    } catch (error) {
      logger.error('Rate limit check error', { key, error: error.message })
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        current: 0,
        remaining: maxRequests,
        resetTime: new Date(Date.now() + windowMs),
        retryAfter: null
      }
    }
  }
}

// Organization chart specific cache functions
const orgCache = {
  // Cache organization hierarchy
  setOrgHierarchy: async (ministryId, hierarchy, ttlSeconds = 1800) => {
    const key = `org:hierarchy:${ministryId}`
    return await cache.set(key, hierarchy, ttlSeconds)
  },

  // Get cached organization hierarchy
  getOrgHierarchy: async (ministryId) => {
    const key = `org:hierarchy:${ministryId}`
    return await cache.get(key)
  },

  // Invalidate organization cache
  invalidateOrgCache: async (ministryId = null) => {
    if (ministryId) {
      return await cache.delPattern(`org:*:${ministryId}`)
    } else {
      return await cache.delPattern('org:*')
    }
  },

  // Cache user permissions
  setUserPermissions: async (userId, permissions, ttlSeconds = 3600) => {
    const key = `user:permissions:${userId}`
    return await cache.set(key, permissions, ttlSeconds)
  },

  // Get cached user permissions
  getUserPermissions: async (userId) => {
    const key = `user:permissions:${userId}`
    return await cache.get(key)
  },

  // Invalidate user permissions cache
  invalidateUserPermissions: async (userId) => {
    const key = `user:permissions:${userId}`
    return await cache.del(key)
  }
}

// Health check
const healthCheck = async () => {
  try {
    await redis.ping()
    return true
  } catch (error) {
    logger.error('Redis health check failed', { error: error.message })
    return false
  }
}

// Get Redis statistics
const getStats = async () => {
  try {
    const info = await redis.info()
    const lines = info.split('\r\n')
    const stats = {}

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':')
        stats[key] = value
      }
    })

    return {
      connected: redis.status === 'ready',
      uptime: stats.uptime_in_seconds,
      connectedClients: stats.connected_clients,
      usedMemory: stats.used_memory_human,
      totalCommandsProcessed: stats.total_commands_processed,
      keyspaceHits: stats.keyspace_hits,
      keyspaceMisses: stats.keyspace_misses
    }
  } catch (error) {
    logger.error('Failed to get Redis stats', { error: error.message })
    return null
  }
}

// Graceful shutdown
const closeConnection = async () => {
  try {
    await redis.quit()
    logger.info('Redis connection closed gracefully')
  } catch (error) {
    logger.error('Error closing Redis connection', { error: error.message })
  }
}

module.exports = {
  redis,
  cache,
  sessionCache,
  rateLimitCache,
  orgCache,
  testConnection,
  healthCheck,
  getStats,
  closeConnection
}