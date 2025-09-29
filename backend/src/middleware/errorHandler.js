const logger = require('../config/logger')
const config = require('../config')

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', code = 'AUTH_FAILED') {
    super(message, 401, code)
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', code = 'INSUFFICIENT_PERMISSIONS') {
    super(message, 403, code)
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT', details)
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = null) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED')
    this.retryAfter = retryAfter
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR')
    this.originalError = originalError
  }
}

// Error type detection
const getErrorType = (error) => {
  // PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        return 'DUPLICATE_ENTRY'
      case '23503': // foreign_key_violation
        return 'FOREIGN_KEY_VIOLATION'
      case '23502': // not_null_violation
        return 'REQUIRED_FIELD_MISSING'
      case '23514': // check_violation
        return 'CONSTRAINT_VIOLATION'
      case '42P01': // undefined_table
      case '42703': // undefined_column
        return 'SCHEMA_ERROR'
      case '53300': // too_many_connections
        return 'CONNECTION_ERROR'
      default:
        return 'DATABASE_ERROR'
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') return 'INVALID_TOKEN'
  if (error.name === 'TokenExpiredError') return 'TOKEN_EXPIRED'
  if (error.name === 'NotBeforeError') return 'TOKEN_NOT_ACTIVE'

  // Validation errors
  if (error.name === 'ValidationError') return 'VALIDATION_ERROR'

  // Multer errors (file upload)
  if (error.code === 'LIMIT_FILE_SIZE') return 'FILE_TOO_LARGE'
  if (error.code === 'LIMIT_UNEXPECTED_FILE') return 'INVALID_FILE_FIELD'

  // Redis errors
  if (error.message && error.message.includes('Redis')) return 'CACHE_ERROR'

  return 'UNKNOWN_ERROR'
}

// Convert database errors to user-friendly messages
const handleDatabaseError = (error) => {
  const errorType = getErrorType(error)

  switch (errorType) {
    case 'DUPLICATE_ENTRY':
      // Extract the field name from the error detail
      let field = 'field'
      if (error.detail) {
        const match = error.detail.match(/Key \(([^)]+)\)/)
        if (match) field = match[1]
      }
      return new ConflictError(`Duplicate entry: ${field} already exists`, {
        field,
        constraint: error.constraint
      })

    case 'FOREIGN_KEY_VIOLATION':
      return new ValidationError('Invalid reference: Related record does not exist', {
        constraint: error.constraint,
        table: error.table
      })

    case 'REQUIRED_FIELD_MISSING':
      let column = 'field'
      if (error.column) column = error.column
      return new ValidationError(`Required field missing: ${column}`, {
        field: column
      })

    case 'CONSTRAINT_VIOLATION':
      return new ValidationError('Data constraint violation', {
        constraint: error.constraint,
        detail: error.detail
      })

    case 'CONNECTION_ERROR':
      return new AppError('Database connection error', 503, 'SERVICE_UNAVAILABLE')

    default:
      return new DatabaseError('Database operation failed', error)
  }
}

// Convert various errors to standardized format
const handleKnownErrors = (error) => {
  // Custom app errors
  if (error instanceof AppError) {
    return error
  }

  // Database errors
  if (error.code && typeof error.code === 'string') {
    return handleDatabaseError(error)
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid authentication token', 'INVALID_TOKEN')
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Authentication token has expired', 'TOKEN_EXPIRED')
  }

  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    const maxSize = Math.floor(config.upload.maxFileSize / 1024 / 1024)
    return new ValidationError(`File too large. Maximum size is ${maxSize}MB`)
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Invalid file field or too many files')
  }

  // Syntax errors (shouldn't happen in production)
  if (error instanceof SyntaxError) {
    return new ValidationError('Invalid request format')
  }

  // Default to internal server error
  return new AppError('Internal server error', 500, 'INTERNAL_ERROR')
}

// Main error handling middleware
const errorHandler = (error, req, res, next) => {
  const startTime = Date.now()

  // Handle the error
  const handledError = handleKnownErrors(error)

  // Create error response
  const errorResponse = {
    success: false,
    error: handledError.message,
    code: handledError.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  }

  // Add details for client errors (4xx)
  if (handledError.statusCode < 500 && handledError.details) {
    errorResponse.details = handledError.details
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id
  }

  // Add retry after for rate limiting
  if (handledError instanceof RateLimitError && handledError.retryAfter) {
    res.set('Retry-After', handledError.retryAfter)
    errorResponse.retryAfter = handledError.retryAfter
  }

  // Log the error
  const logData = {
    error: handledError.message,
    code: handledError.code,
    statusCode: handledError.statusCode,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    sessionId: req.sessionID,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    responseTime: `${Date.now() - startTime}ms`,
    stack: handledError.stack
  }

  // Log based on severity
  if (handledError.statusCode >= 500) {
    // Server errors - always log as error
    logger.error('Server Error', logData)

    // Log security events for certain errors
    if (handledError.code === 'DATABASE_ERROR') {
      logger.security('database_error', {
        severity: 'high',
        userId: req.user?.id,
        ipAddress: req.ip,
        details: { originalError: error.message }
      })
    }
  } else if (handledError.statusCode >= 400) {
    // Client errors - log as warning
    logger.warn('Client Error', logData)

    // Log security events for authentication/authorization failures
    if (handledError instanceof AuthenticationError || handledError instanceof AuthorizationError) {
      logger.security('access_denied', {
        severity: 'medium',
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        resource: req.originalUrl,
        action: req.method,
        details: { error: handledError.message }
      })
    }
  } else {
    // Info level for other errors
    logger.info('Request Error', logData)
  }

  // Don't include stack trace in production
  if (config.app.env !== 'production' && handledError.statusCode >= 500) {
    errorResponse.stack = handledError.stack
  }

  // Send error response
  res.status(handledError.statusCode).json(errorResponse)
}

// 404 handler for unmatched routes
const notFoundHandler = (req, res) => {
  const error = new NotFoundError('Endpoint')

  logger.warn('Route Not Found', {
    path: req.originalUrl,
    method: req.method,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  })

  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  })
}

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Global unhandled rejection and exception handlers
const setupGlobalErrorHandlers = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString()
    })

    // Close server gracefully
    if (config.app.env === 'production') {
      process.exit(1)
    }
  })

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    })

    // Close server gracefully
    process.exit(1)
  })
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  setupGlobalErrorHandlers
}