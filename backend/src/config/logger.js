const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const path = require('path')

// Create logs directory if it doesn't exist
const fs = require('fs')
const logsDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta)}`
    }

    // Add stack trace for errors
    if (stack) {
      log += `\nStack: ${stack}`
    }

    return log
  })
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`

    // Add metadata if present (but keep it concise for console)
    if (Object.keys(meta).length > 0) {
      const metaStr = JSON.stringify(meta, null, 0)
      if (metaStr.length < 200) {
        log += ` ${metaStr}`
      } else {
        log += ` {${Object.keys(meta).join(', ')}}`
      }
    }

    return log
  })
)

// Transport configurations
const transports = []

// Console transport (always enabled in development)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true') {
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true
    })
  )
}

// File transport for all logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    handleExceptions: true,
    handleRejections: true
  })
)

// Error-only file transport
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '30d',
    level: 'error',
    format: customFormat,
    handleExceptions: true,
    handleRejections: true
  })
)

// Audit log transport (for security-related events)
const auditTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.AUDIT_LOG_RETENTION || '2555d', // 7 years for Qatar government
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
})

// Create the main logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false,
  silent: process.env.NODE_ENV === 'test'
})

// Create audit logger for security events
const auditLogger = winston.createLogger({
  transports: [auditTransport],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  exitOnError: false,
  silent: process.env.NODE_ENV === 'test'
})

// Helper methods for structured logging
logger.audit = (event, data = {}) => {
  const auditEntry = {
    event,
    timestamp: new Date().toISOString(),
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    resource: data.resource || null,
    action: data.action || null,
    result: data.result || 'success',
    details: data.details || {},
    severity: data.severity || 'info'
  }

  auditLogger.info(auditEntry)

  // Also log to main logger if it's a security event
  if (data.severity === 'critical' || data.severity === 'high') {
    logger.warn('Security Event', auditEntry)
  }
}

logger.request = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || null,
    sessionId: req.sessionID || null
  }

  // Log level based on status code
  if (res.statusCode >= 500) {
    logger.error('HTTP Request', logData)
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData)
  } else {
    logger.info('HTTP Request', logData)
  }
}

logger.db = (operation, table, data = {}) => {
  logger.debug('Database Operation', {
    operation,
    table,
    userId: data.userId || null,
    recordId: data.recordId || null,
    duration: data.duration || null,
    rowCount: data.rowCount || null
  })
}

logger.auth = (event, data = {}) => {
  const authData = {
    event,
    userId: data.userId || null,
    username: data.username || null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    success: data.success !== false,
    reason: data.reason || null,
    sessionId: data.sessionId || null
  }

  // Always audit authentication events
  logger.audit(`auth_${event}`, authData)

  // Log to main logger
  if (authData.success) {
    logger.info(`Authentication: ${event}`, authData)
  } else {
    logger.warn(`Authentication Failed: ${event}`, authData)
  }
}

logger.security = (event, data = {}) => {
  const securityData = {
    event,
    severity: data.severity || 'medium',
    userId: data.userId || null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    resource: data.resource || null,
    action: data.action || null,
    details: data.details || {}
  }

  // Always audit security events
  logger.audit(`security_${event}`, securityData)

  // Log to main logger based on severity
  if (securityData.severity === 'critical') {
    logger.error(`Security Alert: ${event}`, securityData)
  } else if (securityData.severity === 'high') {
    logger.warn(`Security Warning: ${event}`, securityData)
  } else {
    logger.info(`Security Event: ${event}`, securityData)
  }
}

// Performance logging
logger.performance = (operation, duration, data = {}) => {
  const perfData = {
    operation,
    duration: `${duration}ms`,
    ...data
  }

  if (duration > 5000) {
    logger.warn('Slow Operation', perfData)
  } else if (duration > 1000) {
    logger.info('Performance', perfData)
  } else {
    logger.debug('Performance', perfData)
  }
}

// Graceful shutdown
logger.shutdown = () => {
  return new Promise((resolve) => {
    logger.info('Shutting down logger...')
    logger.end(() => {
      auditLogger.end(() => {
        resolve()
      })
    })
  })
}

// Handle uncaught exceptions and rejections
if (process.env.NODE_ENV !== 'test') {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    })
    process.exit(1)
  })

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString()
    })
  })
}

module.exports = logger