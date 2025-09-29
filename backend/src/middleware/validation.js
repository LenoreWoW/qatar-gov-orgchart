const Joi = require('joi')
const { body, param, query, validationResult } = require('express-validator')
const logger = require('../config/logger')
const config = require('../config')

// Custom Joi validations for Qatar Government
const customValidations = {
  // Qatar National ID validation (11 digits)
  nationalId: Joi.string()
    .length(config.validation.nationalIdLength)
    .pattern(/^\d{11}$/)
    .messages({
      'string.length': 'National ID must be exactly 11 digits',
      'string.pattern.base': 'National ID must contain only numbers'
    }),

  // Employee number validation
  employeeNumber: Joi.string()
    .length(config.validation.employeeNumberLength)
    .pattern(/^[A-Z]{2,3}\d{6}$/)
    .messages({
      'string.pattern.base': 'Employee number must be in format: ABC123456'
    }),

  // Government grade validation (1-20)
  governmentGrade: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .messages({
      'number.min': 'Government grade must be between 1 and 20',
      'number.max': 'Government grade must be between 1 and 20'
    }),

  // Custom ID validation (supports both UUIDs and our custom IDs)
  customId: Joi.string()
    .pattern(/^[a-zA-Z0-9\-]{8,50}$/)
    .messages({
      'string.pattern.base': 'Must be a valid ID format'
    }),

  // Arabic text validation
  arabicText: Joi.string()
    .pattern(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669]+$/)
    .messages({
      'string.pattern.base': 'Must contain only Arabic characters'
    }),

  // English text validation
  englishText: Joi.string()
    .pattern(/^[a-zA-Z0-9\s\-\.\_\(\)]+$/)
    .messages({
      'string.pattern.base': 'Must contain only English characters, numbers, and basic punctuation'
    }),

  // Phone number validation (Qatar format)
  phoneNumber: Joi.string()
    .pattern(/^(\+974)?[3456789]\d{7}$/)
    .messages({
      'string.pattern.base': 'Must be a valid Qatar phone number'
    }),

  // Email validation
  email: Joi.string()
    .email()
    .max(255)
    .messages({
      'string.email': 'Must be a valid email address',
      'string.max': 'Email cannot exceed 255 characters'
    }),

  // Password validation
  password: Joi.when(Joi.ref('$requireComplexity'), {
    is: true,
    then: Joi.string()
      .min(config.auth.passwordMinLength)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
      .required()
      .messages({
        'string.min': `Password must be at least ${config.auth.passwordMinLength} characters`,
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    otherwise: Joi.string()
      .min(config.auth.passwordMinLength)
      .max(128)
      .required()
      .messages({
        'string.min': `Password must be at least ${config.auth.passwordMinLength} characters`,
        'string.max': 'Password cannot exceed 128 characters'
      })
  }),

  // Date validation
  date: Joi.date()
    .iso()
    .messages({
      'date.format': 'Date must be in ISO format (YYYY-MM-DD)'
    }),

  // Pagination validation
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(config.pagination.maxLimit).default(config.pagination.defaultLimit),
    offset: Joi.number().integer().min(0).default(0)
  }
}

// Validation schema definitions
const schemas = {
  // User validation schemas
  user: {
    create: Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required(),
      email: customValidations.email.required(),
      password: customValidations.password.required(),
      first_name: customValidations.englishText.min(2).max(100).required(),
      last_name: customValidations.englishText.min(2).max(100).required(),
      first_name_ar: customValidations.arabicText.min(2).max(100).optional(),
      last_name_ar: customValidations.arabicText.min(2).max(100).optional(),
      national_id: customValidations.nationalId.optional(),
      role: Joi.string().valid('super_admin', 'ministry_admin', 'hr_admin', 'manager', 'viewer').required(),
      ministry_id: customValidations.customId.optional()
    }),

    update: Joi.object({
      email: customValidations.email.optional(),
      first_name: customValidations.englishText.min(2).max(100).optional(),
      last_name: customValidations.englishText.min(2).max(100).optional(),
      first_name_ar: customValidations.arabicText.min(2).max(100).optional(),
      last_name_ar: customValidations.arabicText.min(2).max(100).optional(),
      role: Joi.string().valid('super_admin', 'ministry_admin', 'hr_admin', 'manager', 'viewer').optional(),
      status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
      ministry_id: customValidations.customId.optional()
    }),

    login: Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
      remember_me: Joi.boolean().default(false)
    }),

    changePassword: Joi.object({
      current_password: Joi.string().required(),
      new_password: customValidations.password.required(),
      confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
        'any.only': 'Password confirmation does not match'
      })
    })
  },

  // Ministry validation schemas
  ministry: {
    create: Joi.object({
      code: Joi.string().uppercase().min(2).max(10).pattern(/^[A-Z]+$/).required(),
      name_en: customValidations.englishText.min(3).max(255).required(),
      name_ar: customValidations.arabicText.min(3).max(255).optional(),
      description_en: Joi.string().max(1000).optional(),
      description_ar: customValidations.arabicText.max(1000).optional(),
      website: Joi.string().uri().optional(),
      phone: customValidations.phoneNumber.optional(),
      email: customValidations.email.optional(),
      address_en: Joi.string().max(500).optional(),
      address_ar: customValidations.arabicText.max(500).optional()
    }),

    update: Joi.object({
      name_en: customValidations.englishText.min(3).max(255).optional(),
      name_ar: customValidations.arabicText.min(3).max(255).optional(),
      description_en: Joi.string().max(1000).optional(),
      description_ar: customValidations.arabicText.max(1000).optional(),
      website: Joi.string().uri().optional(),
      phone: customValidations.phoneNumber.optional(),
      email: customValidations.email.optional(),
      address_en: Joi.string().max(500).optional(),
      address_ar: customValidations.arabicText.max(500).optional(),
      is_active: Joi.boolean().optional()
    })
  },

  // Department validation schemas
  department: {
    create: Joi.object({
      ministry_id: customValidations.customId.required(),
      parent_department_id: customValidations.customId.optional(),
      code: Joi.string().uppercase().min(3).max(20).pattern(/^[A-Z0-9\-]+$/).required(),
      name_en: customValidations.englishText.min(3).max(255).required(),
      name_ar: customValidations.arabicText.min(3).max(255).optional(),
      description_en: Joi.string().max(1000).optional(),
      description_ar: customValidations.arabicText.max(1000).optional(),
      level: Joi.number().integer().min(1).max(config.validation.maxDepartmentLevels).required()
    }),

    update: Joi.object({
      name_en: customValidations.englishText.min(3).max(255).optional(),
      name_ar: customValidations.arabicText.min(3).max(255).optional(),
      description_en: Joi.string().max(1000).optional(),
      description_ar: customValidations.arabicText.max(1000).optional(),
      is_active: Joi.boolean().optional()
    })
  },

  // Position validation schemas
  position: {
    create: Joi.object({
      ministry_id: customValidations.customId.required(),
      department_id: customValidations.customId.optional(),
      parent_position_id: customValidations.customId.optional(),
      code: Joi.string().uppercase().min(5).max(30).pattern(/^[A-Z0-9\-]+$/).required(),
      title_en: customValidations.englishText.min(3).max(255).required(),
      title_ar: customValidations.arabicText.min(3).max(255).optional(),
      description_en: Joi.string().max(1000).optional(),
      description_ar: customValidations.arabicText.max(1000).optional(),
      government_grade: customValidations.governmentGrade.required(),
      salary_scale: Joi.string().max(20).optional(),
      status: Joi.string().valid('active', 'vacant', 'temporary', 'archived').default('vacant'),
      max_attributes: Joi.number().integer().min(1).max(config.validation.maxPositionAttributes).default(5),
      requires_security_clearance: Joi.boolean().default(false),
      is_management_position: Joi.boolean().default(false),
      level: Joi.number().integer().min(1).max(config.validation.maxPositionLevels).required()
    }),

    update: Joi.object({
      title_en: customValidations.englishText.min(3).max(255).optional(),
      title_ar: customValidations.arabicText.min(3).max(255).optional(),
      description_en: Joi.string().max(1000).optional(),
      description_ar: customValidations.arabicText.max(1000).optional(),
      government_grade: customValidations.governmentGrade.optional(),
      salary_scale: Joi.string().max(20).optional(),
      status: Joi.string().valid('active', 'vacant', 'temporary', 'archived').optional(),
      max_attributes: Joi.number().integer().min(1).max(config.validation.maxPositionAttributes).optional(),
      requires_security_clearance: Joi.boolean().optional(),
      is_management_position: Joi.boolean().optional()
    })
  },

  // Employee validation schemas
  employee: {
    create: Joi.object({
      employee_number: customValidations.employeeNumber.required(),
      national_id: customValidations.nationalId.required(),
      first_name: customValidations.englishText.min(2).max(100).required(),
      last_name: customValidations.englishText.min(2).max(100).required(),
      first_name_ar: customValidations.arabicText.min(2).max(100).optional(),
      last_name_ar: customValidations.arabicText.min(2).max(100).optional(),
      email: customValidations.email.optional(),
      phone: customValidations.phoneNumber.optional(),
      mobile: customValidations.phoneNumber.optional(),
      birth_date: customValidations.date.optional(),
      hire_date: customValidations.date.required(),
      nationality: Joi.string().max(50).default('Qatari'),
      gender: Joi.string().valid('M', 'F').optional(),
      marital_status: Joi.string().valid('single', 'married', 'divorced', 'widowed').optional()
    }),

    update: Joi.object({
      first_name: customValidations.englishText.min(2).max(100).optional(),
      last_name: customValidations.englishText.min(2).max(100).optional(),
      first_name_ar: customValidations.arabicText.min(2).max(100).optional(),
      last_name_ar: customValidations.arabicText.min(2).max(100).optional(),
      email: customValidations.email.optional(),
      phone: customValidations.phoneNumber.optional(),
      mobile: customValidations.phoneNumber.optional(),
      birth_date: customValidations.date.optional(),
      nationality: Joi.string().max(50).optional(),
      gender: Joi.string().valid('M', 'F').optional(),
      marital_status: Joi.string().valid('single', 'married', 'divorced', 'widowed').optional(),
      is_active: Joi.boolean().optional()
    }),

    assignPosition: Joi.object({
      position_id: customValidations.customId.required(),
      start_date: customValidations.date.required(),
      end_date: customValidations.date.optional(),
      assignment_type: Joi.string().valid('permanent', 'temporary', 'acting').default('permanent'),
      notes: Joi.string().max(500).optional()
    })
  },

  // Attribute validation schemas
  attribute: {
    create: Joi.object({
      code: Joi.string().uppercase().min(3).max(50).pattern(/^[A-Z0-9_]+$/).required(),
      name_en: customValidations.englishText.min(3).max(255).required(),
      name_ar: customValidations.arabicText.min(3).max(255).optional(),
      description_en: Joi.string().max(1000).optional(),
      description_ar: customValidations.arabicText.max(1000).optional(),
      type: Joi.string().valid('security', 'financial', 'administrative', 'technical').required(),
      category: Joi.string().max(100).optional(),
      requires_approval: Joi.boolean().default(false)
    }),

    update: Joi.object({
      name_en: customValidations.englishText.min(3).max(255).optional(),
      name_ar: customValidations.arabicText.min(3).max(255).optional(),
      description_en: Joi.string().max(1000).optional(),
      description_ar: customValidations.arabicText.max(1000).optional(),
      type: Joi.string().valid('security', 'financial', 'administrative', 'technical').optional(),
      category: Joi.string().max(100).optional(),
      requires_approval: Joi.boolean().optional(),
      is_active: Joi.boolean().optional()
    }),

    assignToPosition: Joi.object({
      position_id: customValidations.customId.required(),
      attribute_id: customValidations.customId.required(),
      assigned_date: customValidations.date.default(new Date()),
      expiry_date: customValidations.date.optional(),
      notes: Joi.string().max(500).optional()
    }),

    assignAttributeToPosition: Joi.object({
      attribute_id: customValidations.customId.required(),
      assigned_date: customValidations.date.default(new Date()),
      expiry_date: customValidations.date.optional(),
      notes: Joi.string().max(500).optional()
    })
  },

  // Query parameter validation
  query: {
    pagination: Joi.object({
      page: customValidations.pagination.page,
      limit: customValidations.pagination.limit,
      offset: customValidations.pagination.offset
    }),

    search: Joi.object({
      q: Joi.string().max(255).optional(),
      ministry_id: customValidations.customId.optional(),
      department_id: customValidations.customId.optional(),
      status: Joi.string().optional(),
      sort_by: Joi.string().optional(),
      sort_order: Joi.string().valid('asc', 'desc').default('asc')
    }),

    dateRange: Joi.object({
      start_date: customValidations.date.optional(),
      end_date: customValidations.date.optional()
    })
  },

  // Path parameter validation
  params: {
    id: Joi.object({
      id: customValidations.customId.required()
    }),

    ministryId: Joi.object({
      ministryId: customValidations.customId.required()
    }),

    departmentId: Joi.object({
      departmentId: customValidations.customId.required()
    }),

    positionId: Joi.object({
      positionId: customValidations.customId.required()
    }),

    employeeId: Joi.object({
      employeeId: customValidations.customId.required()
    })
  }
}

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body :
                  source === 'params' ? req.params :
                  source === 'query' ? req.query : req[source]

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      context: {
        requireComplexity: config.auth.requirePasswordComplexity
      }
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      logger.warn('Validation error', {
        source,
        errors,
        userId: req.user?.id,
        ipAddress: req.ip,
        endpoint: req.originalUrl
      })

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      })
    }

    // Replace the source data with validated and sanitized data
    if (source === 'body') req.body = value
    else if (source === 'params') req.params = value
    else if (source === 'query') req.query = value
    else req[source] = value

    next()
  }
}

// Express-validator based validation (alternative approach)
const expressValidations = {
  user: {
    create: [
      body('username').isAlphanumeric().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 alphanumeric characters'),
      body('email').isEmail().normalizeEmail().withMessage('Must be a valid email'),
      body('password').isLength({ min: config.auth.passwordMinLength }).withMessage(`Password must be at least ${config.auth.passwordMinLength} characters`),
      body('first_name').isAlpha('en-US', { ignore: ' -' }).isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
      body('last_name').isAlpha('en-US', { ignore: ' -' }).isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
      body('national_id').optional().isLength({ min: 11, max: 11 }).isNumeric().withMessage('National ID must be 11 digits'),
      body('role').isIn(['super_admin', 'ministry_admin', 'hr_admin', 'manager', 'viewer']).withMessage('Invalid role')
    ]
  },

  login: [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],

  id: [
    param('id').matches(/^[a-zA-Z0-9\-]{8,50}$/).withMessage('Must be a valid ID format')
  ]
}

// Handle express-validator errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }))

    logger.warn('Express validation error', {
      errors: formattedErrors,
      userId: req.user?.id,
      ipAddress: req.ip,
      endpoint: req.originalUrl
    })

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formattedErrors
    })
  }
  next()
}

// Custom validation functions
const customValidators = {
  // Check if ministry exists
  ministryExists: async (ministryId) => {
    if (!ministryId) return true // Optional field

    const { query } = require('../config/database')
    const result = await query('SELECT id FROM ministries WHERE id = $1 AND is_active = true', [ministryId])
    return result.rows.length > 0
  },

  // Check if department exists and belongs to ministry
  departmentExists: async (departmentId, ministryId) => {
    if (!departmentId) return true // Optional field

    const { query } = require('../config/database')
    const result = await query(
      'SELECT id FROM departments WHERE id = $1 AND ministry_id = $2 AND is_active = true',
      [departmentId, ministryId]
    )
    return result.rows.length > 0
  },

  // Check if position code is unique within ministry
  positionCodeUnique: async (code, ministryId, excludeId = null) => {
    const { query } = require('../config/database')
    let query_text = 'SELECT id FROM positions WHERE code = $1 AND ministry_id = $2'
    let params = [code, ministryId]

    if (excludeId) {
      query_text += ' AND id != $3'
      params.push(excludeId)
    }

    const result = await query(query_text, params)
    return result.rows.length === 0
  },

  // Check if employee number is unique
  employeeNumberUnique: async (employeeNumber, excludeId = null) => {
    const { query } = require('../config/database')
    let query_text = 'SELECT id FROM employees WHERE employee_number = $1'
    let params = [employeeNumber]

    if (excludeId) {
      query_text += ' AND id != $2'
      params.push(excludeId)
    }

    const result = await query(query_text, params)
    return result.rows.length === 0
  },

  // Check if national ID is unique
  nationalIdUnique: async (nationalId, excludeId = null) => {
    if (!nationalId) return true // Optional field

    const { query } = require('../config/database')
    let query_text = 'SELECT id FROM employees WHERE national_id = $1'
    let params = [nationalId]

    if (excludeId) {
      query_text += ' AND id != $2'
      params.push(excludeId)
    }

    const result = await query(query_text, params)
    return result.rows.length === 0
  }
}

module.exports = {
  validate,
  schemas,
  expressValidations,
  handleValidationErrors,
  customValidators,
  customValidations
}