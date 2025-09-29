const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { query } = require('../config/database')
const { sessionCache, rateLimitCache } = require('../config/redis')
const logger = require('../config/logger')
const config = require('../config')

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    let token = null

    // Check for token in Authorization header
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // Check for token in cookies
    if (!token && req.cookies.auth_token) {
      token = req.cookies.auth_token
    }

    // Check for session-based authentication
    if (!token && req.sessionID) {
      const session = await sessionCache.getSession(req.sessionID)
      if (session && session.userId) {
        // Validate session user still exists and is active
        const userResult = await query(
          'SELECT id, username, email, role, status, ministry_id FROM users WHERE id = $1 AND status = $2',
          [session.userId, 'active']
        )

        if (userResult.rows.length > 0) {
          req.user = userResult.rows[0]
          req.sessionData = session

          // Log session access
          logger.auth('session_access', {
            userId: req.user.id,
            username: req.user.username,
            sessionId: req.sessionID,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          })

          return next()
        } else {
          // Invalid user - clear session
          await sessionCache.deleteSession(req.sessionID)
        }
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.auth.jwtSecret)

    // Get user from database
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.status, u.ministry_id,
              m.name_en as ministry_name, m.code as ministry_code
       FROM users u
       LEFT JOIN ministries m ON u.ministry_id = m.id
       WHERE u.id = $1 AND u.status = $2`,
      [decoded.userId, 'active']
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found or inactive.',
        code: 'INVALID_USER'
      })
    }

    const user = userResult.rows[0]

    // Check if user is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked. Please try again later.',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.locked_until
      })
    }

    req.user = user
    req.token = token

    // Log token access
    logger.auth('token_access', {
      userId: user.id,
      username: user.username,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.security('invalid_token', {
        error: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'medium'
      })

      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      })
    }

    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
      ipAddress: req.ip
    })

    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    })
  }
}

// Authorization middleware factory
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.',
          code: 'NOT_AUTHENTICATED'
        })
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.security('unauthorized_access', {
          userId: req.user.id,
          username: req.user.username,
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          resource: req.originalUrl,
          method: req.method,
          ipAddress: req.ip,
          severity: 'medium'
        })

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions.',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: allowedRoles,
          current: req.user.role
        })
      }

      next()
    } catch (error) {
      logger.error('Authorization error', {
        error: error.message,
        userId: req.user?.id,
        requiredRoles: allowedRoles
      })

      res.status(500).json({
        success: false,
        error: 'Internal server error during authorization.',
        code: 'AUTHZ_ERROR'
      })
    }
  }
}

// Ministry-based authorization
const authorizeMinistry = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      })
    }

    // Super admin can access all ministries
    if (req.user.role === 'super_admin') {
      return next()
    }

    // Extract ministry ID from request (params, query, or body)
    const requestedMinistryId = req.params.ministryId || req.query.ministryId || req.body.ministryId

    if (!requestedMinistryId) {
      return next() // No specific ministry requested
    }

    // Check if user belongs to the requested ministry
    if (req.user.ministry_id !== requestedMinistryId) {
      logger.security('ministry_access_denied', {
        userId: req.user.id,
        username: req.user.username,
        userMinistry: req.user.ministry_id,
        requestedMinistry: requestedMinistryId,
        resource: req.originalUrl,
        ipAddress: req.ip,
        severity: 'medium'
      })

      return res.status(403).json({
        success: false,
        error: 'Access denied to this ministry data.',
        code: 'MINISTRY_ACCESS_DENIED'
      })
    }

    next()
  } catch (error) {
    logger.error('Ministry authorization error', {
      error: error.message,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Internal server error during ministry authorization.',
      code: 'MINISTRY_AUTHZ_ERROR'
    })
  }
}

// Resource-based authorization (for specific positions, employees, etc.)
const authorizeResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.',
          code: 'NOT_AUTHENTICATED'
        })
      }

      // Super admin can access all resources
      if (req.user.role === 'super_admin') {
        return next()
      }

      const resourceId = req.params.id
      if (!resourceId) {
        return next() // No specific resource requested
      }

      let query_text, params

      switch (resourceType) {
        case 'position':
          query_text = 'SELECT ministry_id FROM positions WHERE id = $1'
          params = [resourceId]
          break
        case 'employee':
          query_text = `
            SELECT p.ministry_id
            FROM employees e
            JOIN employee_positions ep ON e.id = ep.employee_id AND ep.is_current = true
            JOIN positions p ON ep.position_id = p.id
            WHERE e.id = $1
          `
          params = [resourceId]
          break
        case 'department':
          query_text = 'SELECT ministry_id FROM departments WHERE id = $1'
          params = [resourceId]
          break
        default:
          return next() // Unknown resource type, allow access
      }

      const result = await query(query_text, params)

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `${resourceType} not found.`,
          code: 'RESOURCE_NOT_FOUND'
        })
      }

      const resourceMinistryId = result.rows[0].ministry_id

      // Check if user has access to this resource's ministry
      if (req.user.ministry_id !== resourceMinistryId) {
        logger.security('resource_access_denied', {
          userId: req.user.id,
          username: req.user.username,
          userMinistry: req.user.ministry_id,
          resourceMinistry: resourceMinistryId,
          resourceType,
          resourceId,
          resource: req.originalUrl,
          ipAddress: req.ip,
          severity: 'medium'
        })

        return res.status(403).json({
          success: false,
          error: `Access denied to this ${resourceType}.`,
          code: 'RESOURCE_ACCESS_DENIED'
        })
      }

      next()
    } catch (error) {
      logger.error('Resource authorization error', {
        error: error.message,
        resourceType,
        resourceId: req.params.id,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: 'Internal server error during resource authorization.',
        code: 'RESOURCE_AUTHZ_ERROR'
      })
    }
  }
}

// Rate limiting middleware
const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || config.rateLimit.windowMs
  const maxRequests = options.maxRequests || config.rateLimit.maxRequests
  const keyGenerator = options.keyGenerator || ((req) => req.ip)
  const skipSuccessfulRequests = options.skipSuccessfulRequests || false

  return async (req, res, next) => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`
      const result = await rateLimitCache.checkRateLimit(key, windowMs, maxRequests)

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': result.resetTime.toISOString()
      })

      if (!result.allowed) {
        res.set('Retry-After', result.retryAfter)

        logger.security('rate_limit_exceeded', {
          key,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
          current: result.current,
          limit: maxRequests,
          severity: 'medium'
        })

        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter,
          resetTime: result.resetTime
        })
      }

      // Track successful requests if not skipping
      if (!skipSuccessfulRequests) {
        res.on('finish', () => {
          if (res.statusCode < 400) {
            // This was a successful request, already counted
          }
        })
      }

      next()
    } catch (error) {
      logger.error('Rate limiting error', {
        error: error.message,
        ipAddress: req.ip
      })

      // Fail open - allow request if rate limiting fails
      next()
    }
  }
}

// Login rate limiting (stricter)
const loginRateLimit = rateLimit({
  windowMs: 900000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => `login:${req.ip}:${req.body.username || 'unknown'}`
})

// API rate limiting (general)
const apiRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  maxRequests: config.rateLimit.maxRequests,
  keyGenerator: (req) => req.user ? `api:user:${req.user.id}` : `api:ip:${req.ip}`
})

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      // Authentication succeeded
      next()
    })
  } catch (error) {
    // Authentication failed, but continue without user
    req.user = null
    next()
  }
}

module.exports = {
  authenticate,
  authorize,
  authorizeMinistry,
  authorizeResource,
  rateLimit,
  loginRateLimit,
  apiRateLimit,
  optionalAuth
}