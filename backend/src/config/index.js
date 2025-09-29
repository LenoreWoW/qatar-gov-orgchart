require('dotenv').config()

const config = {
  // Application
  app: {
    name: process.env.APP_NAME || 'Qatar Government OrgChart',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    trustProxy: process.env.TRUST_PROXY === 'true'
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'qatar_gov_orgchart',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0
  },

  // Authentication & Security
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 1800000, // 30 minutes
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    requirePasswordComplexity: process.env.REQUIRE_PASSWORD_COMPLEXITY === 'true'
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'your_super_secret_session_key_here',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 3600000, // 1 hour
    secureCookies: process.env.SECURE_COOKIES === 'true',
    sameSite: process.env.SAME_SITE_COOKIES || 'lax'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,application/pdf').split(','),
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@gov.qa',
      name: process.env.FROM_NAME || 'Qatar Government OrgChart'
    }
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d'
  },

  // Government Specific
  government: {
    defaultMinistry: process.env.DEFAULT_MINISTRY || 'MOI',
    arabicSupport: process.env.ARABIC_SUPPORT === 'true',
    rtlSupport: process.env.RTL_SUPPORT === 'true',
    auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 2555, // 7 years
    dataRetentionYears: parseInt(process.env.DATA_RETENTION_YEARS) || 7
  },

  // Development/Testing
  development: {
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === 'true',
    mockExternalApis: process.env.MOCK_EXTERNAL_APIS === 'true'
  },

  // Cache TTL settings (in seconds)
  cache: {
    orgHierarchy: 1800, // 30 minutes
    userPermissions: 3600, // 1 hour
    userProfile: 1800, // 30 minutes
    systemSettings: 7200, // 2 hours
    attributes: 3600, // 1 hour
    departments: 3600 // 1 hour
  },

  // Validation rules
  validation: {
    nationalIdLength: 11,
    employeeNumberLength: 9,
    maxPositionAttributes: 10,
    maxDepartmentLevels: 5,
    maxPositionLevels: 10
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },

  // Security headers
  security: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  }
}

// Validation
const validateConfig = () => {
  const required = [
    'DB_PASSWORD',
    'JWT_SECRET',
    'SESSION_SECRET'
  ]

  const missing = required.filter(key => !process.env[key] || process.env[key] === 'your_password_here' || process.env[key].includes('change_in_production'))

  if (missing.length > 0 && config.app.env === 'production') {
    throw new Error(`Missing or invalid required environment variables: ${missing.join(', ')}`)
  }

  // Warn about development values in production
  if (config.app.env === 'production') {
    const warnings = []

    if (config.auth.jwtSecret.includes('secret')) {
      warnings.push('JWT_SECRET appears to be a default value')
    }

    if (config.session.secret.includes('secret')) {
      warnings.push('SESSION_SECRET appears to be a default value')
    }

    if (warnings.length > 0) {
      console.warn('Security Warning:', warnings.join(', '))
    }
  }
}

// Initialize configuration
try {
  validateConfig()
} catch (error) {
  console.error('Configuration Error:', error.message)
  process.exit(1)
}

module.exports = config