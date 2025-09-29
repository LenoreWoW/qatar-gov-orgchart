const express = require('express')
const bcrypt = require('bcrypt')
const { body } = require('express-validator')

const { query, transaction } = require('../config/database')
const { orgCache } = require('../config/redis')
const logger = require('../config/logger')
const config = require('../config')
const { validate, schemas, customValidators } = require('../middleware/validation')
const { authenticate, authorize, authorizeMinistry } = require('../middleware/auth')
const { asyncHandler, ValidationError, NotFoundError, ConflictError } = require('../middleware/errorHandler')

const router = express.Router()

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (super_admin, hr_admin)
 */
router.get('/',
  authenticate,
  authorize('super_admin', 'hr_admin'),
  validate(schemas.query.pagination, 'query'),
  validate(schemas.query.search, 'query'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, q, ministry_id, status, sort_by = 'created_at', sort_order = 'desc' } = req.query
    const offset = (page - 1) * limit

    // Build WHERE clause
    let whereConditions = []
    let queryParams = []
    let paramCount = 0

    // Search query
    if (q) {
      paramCount++
      whereConditions.push(`(
        u.username ILIKE $${paramCount} OR
        u.email ILIKE $${paramCount} OR
        u.first_name ILIKE $${paramCount} OR
        u.last_name ILIKE $${paramCount} OR
        u.first_name_ar ILIKE $${paramCount} OR
        u.last_name_ar ILIKE $${paramCount}
      )`)
      queryParams.push(`%${q}%`)
    }

    // Ministry filter
    if (ministry_id) {
      paramCount++
      whereConditions.push(`u.ministry_id = $${paramCount}`)
      queryParams.push(ministry_id)
    }

    // Status filter
    if (status) {
      paramCount++
      whereConditions.push(`u.status = $${paramCount}`)
      queryParams.push(status)
    }

    // Ministry access control (non-super admins can only see their ministry users)
    if (req.user.role !== 'super_admin' && req.user.ministry_id) {
      paramCount++
      whereConditions.push(`u.ministry_id = $${paramCount}`)
      queryParams.push(req.user.ministry_id)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Validate sort field
    const allowedSortFields = ['username', 'email', 'first_name', 'last_name', 'role', 'status', 'created_at', 'last_login']
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at'
    const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `
    const countResult = await query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get users
    paramCount++
    queryParams.push(limit)
    paramCount++
    queryParams.push(offset)

    const usersQuery = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name,
             u.first_name_ar, u.last_name_ar, u.role, u.status, u.ministry_id,
             u.last_login, u.created_at, u.updated_at,
             m.name_en as ministry_name, m.name_ar as ministry_name_ar, m.code as ministry_code
      FROM users u
      LEFT JOIN ministries m ON u.ministry_id = m.id
      ${whereClause}
      ORDER BY u.${sortField} ${sortDirection}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `

    const usersResult = await query(usersQuery, queryParams)

    const users = usersResult.rows.map(user => ({
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
    }))

    const totalPages = Math.ceil(total / limit)

    res.set('X-Total-Count', total.toString())
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })
  })
)

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (super_admin, hr_admin, or own profile)
 */
router.get('/:id',
  authenticate,
  validate(schemas.params.id, 'params'),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const currentUser = req.user

    // Check permissions
    if (currentUser.role !== 'super_admin' &&
        currentUser.role !== 'hr_admin' &&
        currentUser.id !== id) {
      throw new AuthorizationError('You can only view your own profile')
    }

    const userResult = await query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name,
             u.first_name_ar, u.last_name_ar, u.national_id, u.role, u.status,
             u.ministry_id, u.last_login, u.failed_login_attempts, u.locked_until,
             u.created_at, u.updated_at, u.created_by, u.updated_by,
             m.name_en as ministry_name, m.name_ar as ministry_name_ar, m.code as ministry_code,
             creator.username as created_by_username,
             updater.username as updated_by_username
      FROM users u
      LEFT JOIN ministries m ON u.ministry_id = m.id
      LEFT JOIN users creator ON u.created_by = creator.id
      LEFT JOIN users updater ON u.updated_by = updater.id
      WHERE u.id = $1
    `, [id])

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User')
    }

    const user = userResult.rows[0]

    // Ministry access control
    if (currentUser.role !== 'super_admin' &&
        currentUser.ministry_id !== user.ministry_id &&
        currentUser.id !== id) {
      throw new AuthorizationError('Access denied to this user')
    }

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      firstNameAr: user.first_name_ar,
      lastNameAr: user.last_name_ar,
      nationalId: user.national_id,
      role: user.role,
      status: user.status,
      ministry: user.ministry_id ? {
        id: user.ministry_id,
        name: user.ministry_name,
        nameAr: user.ministry_name_ar,
        code: user.ministry_code
      } : null,
      lastLogin: user.last_login,
      failedLoginAttempts: user.failed_login_attempts,
      lockedUntil: user.locked_until,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      createdBy: user.created_by_username,
      updatedBy: user.updated_by_username
    }

    res.json({
      success: true,
      data: userData
    })
  })
)

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (super_admin, hr_admin)
 */
router.post('/',
  authenticate,
  authorize('super_admin', 'hr_admin'),
  validate(schemas.user.create),
  asyncHandler(async (req, res) => {
    const {
      username, email, password, first_name, last_name,
      first_name_ar, last_name_ar, national_id, role, ministry_id
    } = req.body

    const currentUser = req.user

    // Check if ministry assignment is allowed
    if (ministry_id && currentUser.role !== 'super_admin') {
      if (currentUser.ministry_id !== ministry_id) {
        throw new AuthorizationError('You can only create users for your own ministry')
      }
    }

    // Check if role assignment is allowed
    const roleHierarchy = {
      'super_admin': 5,
      'ministry_admin': 4,
      'hr_admin': 3,
      'manager': 2,
      'viewer': 1
    }

    if (roleHierarchy[role] >= roleHierarchy[currentUser.role]) {
      throw new AuthorizationError('You cannot create users with equal or higher privileges')
    }

    // Validate ministry exists if provided
    if (ministry_id) {
      const valid = await customValidators.ministryExists(ministry_id)
      if (!valid) {
        throw new ValidationError('Invalid ministry ID')
      }
    }

    // Check for existing username
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )

    if (existingUser.rows.length > 0) {
      throw new ConflictError('Username or email already exists')
    }

    // Check for existing national ID if provided
    if (national_id) {
      const existingNationalId = await query(
        'SELECT id FROM users WHERE national_id = $1',
        [national_id]
      )

      if (existingNationalId.rows.length > 0) {
        throw new ConflictError('National ID already exists')
      }
    }

    // Hash password
    const saltRounds = config.auth.bcryptRounds
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const result = await transaction(async (client) => {
      const userResult = await client.query(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name,
          first_name_ar, last_name_ar, national_id, role, ministry_id,
          status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
        RETURNING id, username, email, first_name, last_name, first_name_ar,
                  last_name_ar, role, status, ministry_id, created_at
      `, [
        username, email, passwordHash, first_name, last_name,
        first_name_ar, last_name_ar, national_id, role, ministry_id,
        'active', currentUser.id
      ])

      return userResult.rows[0]
    })

    logger.info('User created', {
      userId: result.id,
      username: result.username,
      role: result.role,
      ministryId: result.ministry_id,
      createdBy: currentUser.id,
      createdByUsername: currentUser.username
    })

    // Return user data (exclude password hash)
    const userData = {
      id: result.id,
      username: result.username,
      email: result.email,
      firstName: result.first_name,
      lastName: result.last_name,
      firstNameAr: result.first_name_ar,
      lastNameAr: result.last_name_ar,
      role: result.role,
      status: result.status,
      ministryId: result.ministry_id,
      createdAt: result.created_at
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userData
    })
  })
)

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (super_admin, hr_admin, or own profile for limited fields)
 */
router.put('/:id',
  authenticate,
  validate(schemas.params.id, 'params'),
  validate(schemas.user.update),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const updateData = req.body
    const currentUser = req.user

    // Check if user exists
    const existingUserResult = await query(
      'SELECT id, username, role, status, ministry_id FROM users WHERE id = $1',
      [id]
    )

    if (existingUserResult.rows.length === 0) {
      throw new NotFoundError('User')
    }

    const existingUser = existingUserResult.rows[0]

    // Check permissions
    const isOwnProfile = currentUser.id === id
    const isAdmin = ['super_admin', 'hr_admin'].includes(currentUser.role)

    if (!isAdmin && !isOwnProfile) {
      throw new AuthorizationError('Access denied')
    }

    // Determine allowed fields based on role
    let allowedFields = []
    if (isOwnProfile && !isAdmin) {
      // Regular users can only update their basic info
      allowedFields = ['email', 'first_name', 'last_name', 'first_name_ar', 'last_name_ar']
    } else if (isAdmin) {
      // Admins can update most fields
      allowedFields = ['email', 'first_name', 'last_name', 'first_name_ar', 'last_name_ar', 'role', 'status', 'ministry_id']
    }

    // Filter update data to only allowed fields
    const filteredUpdateData = {}
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key]
      }
    })

    // Check role permissions
    if (filteredUpdateData.role) {
      const roleHierarchy = {
        'super_admin': 5,
        'ministry_admin': 4,
        'hr_admin': 3,
        'manager': 2,
        'viewer': 1
      }

      if (roleHierarchy[filteredUpdateData.role] >= roleHierarchy[currentUser.role]) {
        throw new AuthorizationError('You cannot assign equal or higher privileges')
      }
    }

    // Check ministry permissions
    if (filteredUpdateData.ministry_id && currentUser.role !== 'super_admin') {
      if (currentUser.ministry_id !== filteredUpdateData.ministry_id) {
        throw new AuthorizationError('You can only assign users to your own ministry')
      }
    }

    // Validate ministry exists if provided
    if (filteredUpdateData.ministry_id) {
      const valid = await customValidators.ministryExists(filteredUpdateData.ministry_id)
      if (!valid) {
        throw new ValidationError('Invalid ministry ID')
      }
    }

    // Check for email conflicts
    if (filteredUpdateData.email) {
      const emailConflict = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [filteredUpdateData.email, id]
      )

      if (emailConflict.rows.length > 0) {
        throw new ConflictError('Email already exists')
      }
    }

    // Build update query
    const updateFields = Object.keys(filteredUpdateData)
    if (updateFields.length === 0) {
      throw new ValidationError('No valid fields to update')
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ')
    const values = updateFields.map(field => filteredUpdateData[field])
    values.push(currentUser.id) // updated_by
    values.push(id) // WHERE clause

    const updateQuery = `
      UPDATE users
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP, updated_by = $${values.length - 1}
      WHERE id = $${values.length}
      RETURNING id, username, email, first_name, last_name, first_name_ar,
                last_name_ar, role, status, ministry_id, updated_at
    `

    const result = await query(updateQuery, values)
    const updatedUser = result.rows[0]

    // Invalidate user permissions cache
    await orgCache.invalidateUserPermissions(id)

    logger.info('User updated', {
      userId: id,
      updatedFields: updateFields,
      updatedBy: currentUser.id,
      updatedByUsername: currentUser.username
    })

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        firstNameAr: updatedUser.first_name_ar,
        lastNameAr: updatedUser.last_name_ar,
        role: updatedUser.role,
        status: updatedUser.status,
        ministryId: updatedUser.ministry_id,
        updatedAt: updatedUser.updated_at
      }
    })
  })
)

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (super_admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('super_admin'),
  validate(schemas.params.id, 'params'),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const currentUser = req.user

    // Check if user exists
    const userResult = await query(
      'SELECT id, username, role, status FROM users WHERE id = $1',
      [id]
    )

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User')
    }

    const user = userResult.rows[0]

    // Prevent self-deletion
    if (currentUser.id === id) {
      throw new ValidationError('You cannot delete your own account')
    }

    // Soft delete user
    await transaction(async (client) => {
      await client.query(`
        UPDATE users
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP, updated_by = $1
        WHERE id = $2
      `, [currentUser.id, id])

      // Invalidate all user sessions
      await sessionCache.deleteUserSessions(id)
    })

    // Invalidate user permissions cache
    await orgCache.invalidateUserPermissions(id)

    logger.info('User deleted', {
      deletedUserId: id,
      deletedUsername: user.username,
      deletedBy: currentUser.id,
      deletedByUsername: currentUser.username
    })

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  })
)

/**
 * @route   POST /api/v1/users/:id/unlock
 * @desc    Unlock user account
 * @access  Private (super_admin, hr_admin)
 */
router.post('/:id/unlock',
  authenticate,
  authorize('super_admin', 'hr_admin'),
  validate(schemas.params.id, 'params'),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const currentUser = req.user

    // Check if user exists
    const userResult = await query(
      'SELECT id, username, locked_until, failed_login_attempts FROM users WHERE id = $1',
      [id]
    )

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User')
    }

    const user = userResult.rows[0]

    // Reset failed attempts and unlock
    await query(`
      UPDATE users
      SET failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP, updated_by = $1
      WHERE id = $2
    `, [currentUser.id, id])

    logger.security('account_unlocked', {
      userId: id,
      username: user.username,
      unlockedBy: currentUser.id,
      unlockedByUsername: currentUser.username,
      severity: 'info'
    })

    res.json({
      success: true,
      message: 'User account unlocked successfully'
    })
  })
)

/**
 * @route   GET /api/v1/users/roles
 * @desc    Get available user roles
 * @access  Private (super_admin, hr_admin)
 */
router.get('/meta/roles',
  authenticate,
  authorize('super_admin', 'hr_admin'),
  asyncHandler(async (req, res) => {
    const roles = [
      { value: 'viewer', label: 'Viewer', description: 'Can view organization chart' },
      { value: 'manager', label: 'Manager', description: 'Can manage team members' },
      { value: 'hr_admin', label: 'HR Admin', description: 'Can manage users and employees' },
      { value: 'ministry_admin', label: 'Ministry Admin', description: 'Can manage ministry data' },
      { value: 'super_admin', label: 'Super Admin', description: 'Can manage everything' }
    ]

    // Filter roles based on current user permissions
    const currentUserRoleLevel = {
      'super_admin': 5,
      'ministry_admin': 4,
      'hr_admin': 3,
      'manager': 2,
      'viewer': 1
    }[req.user.role] || 1

    const allowedRoles = roles.filter(role => {
      const roleLevel = {
        'super_admin': 5,
        'ministry_admin': 4,
        'hr_admin': 3,
        'manager': 2,
        'viewer': 1
      }[role.value] || 1

      return roleLevel < currentUserRoleLevel
    })

    res.json({
      success: true,
      data: allowedRoles
    })
  })
)

module.exports = router