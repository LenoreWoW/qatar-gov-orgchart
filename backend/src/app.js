require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const compression = require('compression')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const ConnectPgSimple = require('connect-pg-simple')(session)
const path = require('path')

// Import configurations and utilities
const config = require('./config')
const logger = require('./config/logger')
const { pool, testConnection: testDb } = require('./config/database')
const { testConnection: testRedis } = require('./config/redis')
const { errorHandler, notFoundHandler, setupGlobalErrorHandlers } = require('./middleware/errorHandler')
const { apiRateLimit } = require('./middleware/auth')

// Setup global error handlers
setupGlobalErrorHandlers()

// Create Express application
const app = express()

// Trust proxy if configured (for proper IP detection behind load balancer)
if (config.app.trustProxy) {
  app.set('trust proxy', 1)
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.app.env === 'production' ? config.security.contentSecurityPolicy : false,
  hsts: config.app.env === 'production' ? config.security.hsts : false,
  crossOriginEmbedderPolicy: false // Disable for API
}))

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}))

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  },
  threshold: 1024
}))

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  strict: true
}))

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}))

app.use(cookieParser())

// Session configuration
const sessionConfig = {
  store: new ConnectPgSimple({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: config.session.secureCookies,
    httpOnly: true,
    maxAge: config.session.maxAge,
    sameSite: config.session.sameSite
  },
  name: 'gov.qa.session'
}

app.use(session(sessionConfig))

// Request ID middleware
app.use((req, res, next) => {
  req.id = require('crypto').randomUUID()
  res.set('X-Request-ID', req.id)
  next()
})

// Logging middleware
const morganFormat = config.app.env === 'production'
  ? 'combined'
  : ':method :url :status :res[content-length] - :response-time ms'

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim())
    }
  },
  skip: (req, res) => {
    // Skip logging for health checks and static files
    return req.url === '/health' || req.url === '/favicon.ico'
  }
}))

// Request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now()

  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime
    logger.request(req, res, responseTime)
  })

  next()
})

// Health check endpoint (before rate limiting)
app.get('/health', async (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.app.version,
    environment: config.app.env,
    uptime: process.uptime(),
    services: {}
  }

  try {
    // Test database connection
    const dbHealthy = await testDb()
    healthData.services.database = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      responseTime: null
    }

    // Test Redis connection
    const redisHealthy = await testRedis()
    healthData.services.redis = {
      status: redisHealthy ? 'healthy' : 'unhealthy',
      responseTime: null
    }

    // Overall health status
    const allHealthy = dbHealthy && redisHealthy
    healthData.status = allHealthy ? 'ok' : 'degraded'

    res.status(allHealthy ? 200 : 503).json(healthData)
  } catch (error) {
    logger.error('Health check failed', { error: error.message })
    healthData.status = 'error'
    healthData.error = error.message
    res.status(503).json(healthData)
  }
})

// Readiness probe endpoint
app.get('/ready', async (req, res) => {
  try {
    // More thorough checks for readiness
    const dbHealthy = await testDb()
    const redisHealthy = await testRedis()

    if (dbHealthy && redisHealthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'ready' : 'not_ready',
          redis: redisHealthy ? 'ready' : 'not_ready'
        }
      })
    }
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message })
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Metrics endpoint (basic)
app.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: config.app.version,
    environment: config.app.env
  }

  res.json(metrics)
})

// Apply rate limiting to API routes
app.use(config.app.apiPrefix, apiRateLimit)

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  etag: true
}))

// API routes
app.use(config.app.apiPrefix + '/auth', require('./routes/auth'))
app.use(config.app.apiPrefix + '/users', require('./routes/users'))
app.use(config.app.apiPrefix + '/ministries', require('./routes/ministries'))
app.use(config.app.apiPrefix + '/departments', require('./routes/departments'))
app.use(config.app.apiPrefix + '/positions', require('./routes/positions'))
app.use(config.app.apiPrefix + '/employees', require('./routes/employees'))
app.use(config.app.apiPrefix + '/attributes', require('./routes/attributes'))
app.use(config.app.apiPrefix + '/organization', require('./routes/organization'))
app.use(config.app.apiPrefix + '/reports', require('./routes/reports'))
app.use(config.app.apiPrefix + '/settings', require('./routes/settings'))

// Development routes
if (config.development.enableDebugRoutes && config.app.env !== 'production') {
  app.use(config.app.apiPrefix + '/debug', require('./routes/debug'))
}

// API documentation (Swagger)
if (config.development.enableSwagger) {
  const swaggerUi = require('swagger-ui-express')
  const swaggerDocument = require('./docs/swagger.json')

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Qatar Government OrgChart API'
  }))
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: config.app.name,
    version: config.app.version,
    environment: config.app.env,
    api: {
      prefix: config.app.apiPrefix,
      documentation: config.development.enableSwagger ? '/api-docs' : null
    },
    status: 'operational',
    timestamp: new Date().toISOString()
  })
})

// 404 handler for unmatched routes
app.use('*', notFoundHandler)

// Global error handler (must be last)
app.use(errorHandler)

// Graceful shutdown function
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`)

  const server = app.get('server')
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed')

      try {
        // Close database connections
        const { closePool } = require('./config/database')
        await closePool()

        // Close Redis connections
        const { closeConnection } = require('./config/redis')
        await closeConnection()

        // Close logger
        await logger.shutdown()

        logger.info('Graceful shutdown completed')
        process.exit(0)
      } catch (error) {
        logger.error('Error during graceful shutdown', { error: error.message })
        process.exit(1)
      }
    })

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forceful shutdown after timeout')
      process.exit(1)
    }, 30000)
  } else {
    process.exit(0)
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server if this file is run directly
if (require.main === module) {
  const startServer = async () => {
    try {
      // Test connections before starting
      logger.info('Testing database connection...')
      const dbReady = await testDb()
      if (!dbReady) {
        throw new Error('Database connection failed')
      }

      logger.info('Testing Redis connection...')
      const redisReady = await testRedis()
      if (!redisReady) {
        logger.warn('Redis connection failed - some features may not work properly')
      }

      // Start the server
      const server = app.listen(config.app.port, () => {
        logger.info('Server started successfully', {
          name: config.app.name,
          version: config.app.version,
          environment: config.app.env,
          port: config.app.port,
          apiPrefix: config.app.apiPrefix,
          pid: process.pid,
          nodeVersion: process.version
        })

        // Performance monitoring
        const memoryUsage = process.memoryUsage()
        logger.info('Memory usage', {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
        })
      })

      // Store server reference for graceful shutdown
      app.set('server', server)

      // Set keep-alive timeout
      server.keepAliveTimeout = 65000
      server.headersTimeout = 66000

    } catch (error) {
      logger.error('Failed to start server', {
        error: error.message,
        stack: error.stack
      })
      process.exit(1)
    }
  }

  startServer()
}

module.exports = app