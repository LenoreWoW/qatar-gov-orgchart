const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { body } = require('express-validator')

const { query, transaction } = require('../config/database')
const { sessionCache, rateLimitCache } = require('../config/redis')
const logger = require('../config/logger')
const config = require('../config')
const { validate, schemas, handleValidationErrors } = require('../middleware/validation')
const { authenticate, loginRateLimit } = require('../middleware/auth')
const { asyncHandler, AuthenticationError, ValidationError, ConflictError } = require('../middleware/errorHandler')

const router = express.Router()

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login',
  loginRateLimit,
  validate(schemas.user.login),
  asyncHandler(async (req, res) => {
    const { username, password, remember_me = false } = req.body
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')

    logger.info('Login attempt', {
      username,
      ipAddress,
      userAgent
    })

    // Get user from database
    const userResult = await query(`
      SELECT u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
             u.first_name_ar, u.last_name_ar, u.role, u.status, u.ministry_id,
             u.failed_login_attempts, u.locked_until, u.last_login,
             m.name_en as ministry_name, m.code as ministry_code
      FROM users u
      LEFT JOIN ministries m ON u.ministry_id = m.id
      WHERE (u.username = $1 OR u.email = $1)
    `, [username])

    if (userResult.rows.length === 0) {
      logger.auth('login_failed', {
        username,
        ipAddress,
        userAgent,
        reason: 'user_not_found',
        success: false
      })

      // Use generic error message to prevent username enumeration
      throw new AuthenticationError('Invalid username or password')
    }

    const user = userResult.rows[0]

    // Check if user is inactive
    if (user.status !== 'active') {
      logger.auth('login_failed', {
        userId: user.id,
        username: user.username,
        ipAddress,
        userAgent,
        reason: 'account_inactive',
        status: user.status,
        success: false
      })

      throw new AuthenticationError('Account is inactive. Please contact administrator.')
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      logger.auth('login_failed', {
        userId: user.id,
        username: user.username,
        ipAddress,
        userAgent,
        reason: 'account_locked',
        lockedUntil: user.locked_until,
        success: false
      })

      const minutesRemaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000)
      throw new AuthenticationError(
        `Account is locked. Try again in ${minutesRemaining} minute(s).`,
        'ACCOUNT_LOCKED'
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1
      const lockoutTime = failedAttempts >= config.auth.maxLoginAttempts
        ? new Date(Date.now() + config.auth.lockoutDuration)
        : null

      await query(`
        UPDATE users
        SET failed_login_attempts = $1, locked_until = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [failedAttempts, lockoutTime, user.id])

      logger.auth('login_failed', {
        userId: user.id,
        username: user.username,
        ipAddress,
        userAgent,
        reason: 'invalid_password',
        failedAttempts,
        accountLocked: !!lockoutTime,
        success: false
      })

      if (lockoutTime) {
        logger.security('account_locked', {
          userId: user.id,
          username: user.username,
          ipAddress,
          failedAttempts,
          lockedUntil: lockoutTime,
          severity: 'medium'
        })

        throw new AuthenticationError(
          `Account locked due to too many failed login attempts. Try again in ${Math.ceil(config.auth.lockoutDuration / 60000)} minutes.`,
          'ACCOUNT_LOCKED'
        )
      }

      throw new AuthenticationError('Invalid username or password')
    }

    // Successful login - reset failed attempts and update last login
    await transaction(async (client) => {
      await client.query(`
        UPDATE users
        SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [user.id])

      // Log successful login to audit trail
      const auditId = 'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
      await client.query(`
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, $2, 'login', 'users', $2, $3, $4, $5)
      `, [auditId, user.id, JSON.stringify({ loginTime: new Date().toISOString() }), ipAddress, userAgent])
    })

    // Generate JWT token
    const tokenExpiry = remember_me ? config.auth.jwtRefreshExpiresIn : config.auth.jwtExpiresIn
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        ministryId: user.ministry_id
      },
      config.auth.jwtSecret,
      { expiresIn: tokenExpiry }
    )

    // Create session data
    const sessionData = {
      userId: user.id,
      username: user.username,
      role: user.role,
      ministryId: user.ministry_id,
      ipAddress,
      userAgent,
      rememberMe: remember_me
    }

    // Store session in cache
    const sessionTTL = remember_me ? 7 * 24 * 3600 : 3600 // 7 days or 1 hour
    await sessionCache.setSession(req.sessionID, user.id, sessionData, sessionTTL)

    // Prepare user data for response (exclude sensitive fields)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      firstNameAr: user.first_name_ar,
      lastNameAr: user.last_name_ar,
      role: user.role,
      ministry: user.ministry_id ? {
        id: user.ministry_id,
        name: user.ministry_name,
        code: user.ministry_code
      } : null,
      lastLogin: user.last_login
    }

    logger.auth('login_success', {
      userId: user.id,
      username: user.username,
      role: user.role,
      ministryId: user.ministry_id,
      ipAddress,
      userAgent,
      rememberMe: remember_me,
      sessionId: req.sessionID,
      success: true
    })

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
        expiresIn: tokenExpiry
      }
    })
  })
)

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
router.post('/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const sessionId = req.sessionID

    // Remove session from cache
    if (sessionId) {
      await sessionCache.deleteSession(sessionId)
    }

    // Log logout
    logger.auth('logout', {
      userId,
      username: req.user.username,
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    res.json({
      success: true,
      message: 'Logout successful'
    })
  })
)

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = req.user

    // Generate new token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        ministryId: user.ministry_id
      },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
    )

    logger.auth('token_refresh', {
      userId: user.id,
      username: user.username,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    res.json({
      success: true,
      data: {
        token,
        expiresIn: config.auth.jwtExpiresIn
      }
    })
  })
)

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id

    // Get updated user data
    const userResult = await query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name,
             u.first_name_ar, u.last_name_ar, u.role, u.status, u.ministry_id,
             u.last_login, u.created_at, u.updated_at,
             m.name_en as ministry_name, m.name_ar as ministry_name_ar, m.code as ministry_code
      FROM users u
      LEFT JOIN ministries m ON u.ministry_id = m.id
      WHERE u.id = $1 AND u.status = 'active'
    `, [userId])

    if (userResult.rows.length === 0) {
      throw new AuthenticationError('User not found or inactive')
    }

    const user = userResult.rows[0]

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      firstNameAr: user.first_name_ar,
      lastNameAr: user.last_name_ar,
      role: user.role,
      status: user.status,
      ministry: user.ministry_id ? {
        id: user.ministry_id,
        name: user.ministry_name,
        nameAr: user.ministry_name_ar,
        code: user.ministry_code
      } : null,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }

    res.json({
      success: true,
      data: userData
    })
  })
)

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticate,
  validate(schemas.user.changePassword),
  asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body
    const userId = req.user.id

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      throw new AuthenticationError('User not found')
    }

    const currentPasswordHash = userResult.rows[0].password_hash

    // Verify current password
    const passwordValid = await bcrypt.compare(current_password, currentPasswordHash)
    if (!passwordValid) {
      logger.security('password_change_failed', {
        userId,
        username: req.user.username,
        reason: 'invalid_current_password',
        ipAddress: req.ip,
        severity: 'medium'
      })

      throw new AuthenticationError('Current password is incorrect')
    }

    // Hash new password
    const saltRounds = config.auth.bcryptRounds
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds)

    // Update password
    await transaction(async (client) => {
      await client.query(`
        UPDATE users
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
        WHERE id = $2
      `, [newPasswordHash, userId])

      // Log password change
      await client.query(`
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, 'update', 'users', $1, $2, $3, $4)
      `, [
        userId,
        JSON.stringify({ action: 'password_changed' }),
        req.ip,
        req.get('User-Agent')
      ])
    })

    // Invalidate all user sessions except current
    await sessionCache.deleteUserSessions(userId)

    logger.security('password_changed', {
      userId,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'info'
    })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  })
)

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password',
  loginRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email } = req.body

    // Check if user exists
    const userResult = await query(
      'SELECT id, username, email, first_name, last_name FROM users WHERE email = $1 AND status = $2',
      [email, 'active']
    )

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    })

    if (userResult.rows.length === 0) {
      logger.security('password_reset_attempt', {
        email,
        ipAddress: req.ip,
        reason: 'email_not_found',
        severity: 'low'
      })
      return
    }

    const user = userResult.rows[0]

    // Generate reset token (in a real implementation, you'd send this via email)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    )

    logger.security('password_reset_requested', {
      userId: user.id,
      username: user.username,
      email: user.email,
      ipAddress: req.ip,
      severity: 'info'
    })

    // TODO: Send email with reset link
    // For now, just log the token (remove in production)
    if (config.app.env !== 'production') {
      logger.info('Password reset token (DEV ONLY)', {
        userId: user.id,
        resetToken,
        resetUrl: `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`
      })
    }
  })
)

/**
 * @route   GET /api/v1/auth/validate-session
 * @desc    Validate current session
 * @access  Private
 */
router.get('/validate-session',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          ministry: req.user.ministry_id
        }
      }
    })
  })
)

module.exports = router