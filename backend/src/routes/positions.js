const express = require('express')
const { query, transaction } = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { validate, schemas } = require('../middleware/validation')
const { asyncHandler, NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler')
const logger = require('../config/logger')

const router = express.Router()

/**
 * @route   GET /api/v1/positions
 * @desc    Get positions with filtering
 * @access  Private
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { ministry_id, department_id, status, grade_min, grade_max, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let whereConditions = []
    let queryParams = []
    let paramCount = 0

    if (ministry_id) {
      paramCount++
      whereConditions.push(`p.ministry_id = $${paramCount}`)
      queryParams.push(ministry_id)
    }

    if (department_id) {
      paramCount++
      whereConditions.push(`p.department_id = $${paramCount}`)
      queryParams.push(department_id)
    }

    if (status) {
      paramCount++
      whereConditions.push(`p.status = $${paramCount}`)
      queryParams.push(status)
    }

    if (grade_min) {
      paramCount++
      whereConditions.push(`p.government_grade >= $${paramCount}`)
      queryParams.push(grade_min)
    }

    if (grade_max) {
      paramCount++
      whereConditions.push(`p.government_grade <= $${paramCount}`)
      queryParams.push(grade_max)
    }

    // Ministry access control
    if (req.user.role !== 'super_admin' && req.user.ministry_id) {
      paramCount++
      whereConditions.push(`p.ministry_id = $${paramCount}`)
      queryParams.push(req.user.ministry_id)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM positions p ${whereClause}`, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get positions
    paramCount++
    queryParams.push(limit)
    paramCount++
    queryParams.push(offset)

    const result = await query(`
      SELECT p.id, p.ministry_id, p.department_id, p.parent_position_id,
             p.code, p.title_en, p.title_ar, p.description_en, p.description_ar,
             p.government_grade, p.salary_scale, p.status, p.max_attributes,
             p.requires_security_clearance, p.is_management_position, p.level,
             p.created_at, p.updated_at,
             m.name_en as ministry_name, m.code as ministry_code,
             d.name_en as department_name,
             ep.employee_id,
             e.first_name, e.last_name, e.first_name_ar, e.last_name_ar,
             COUNT(pa.id) as attribute_count
      FROM positions p
      LEFT JOIN ministries m ON p.ministry_id = m.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN employee_positions ep ON p.id = ep.position_id AND ep.is_current = true
      LEFT JOIN employees e ON ep.employee_id = e.id
      LEFT JOIN position_attributes pa ON p.id = pa.position_id AND pa.is_active = true
      ${whereClause}
      GROUP BY p.id, p.ministry_id, p.department_id, p.parent_position_id,
               p.code, p.title_en, p.title_ar, p.description_en, p.description_ar,
               p.government_grade, p.salary_scale, p.status, p.max_attributes,
               p.requires_security_clearance, p.is_management_position, p.level,
               p.created_at, p.updated_at, m.name_en, m.code, d.name_en,
               ep.employee_id, e.first_name, e.last_name, e.first_name_ar, e.last_name_ar
      ORDER BY p.government_grade DESC, p.title_en ASC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, queryParams)

    const positions = result.rows.map(pos => ({
      id: pos.id,
      ministryId: pos.ministry_id,
      departmentId: pos.department_id,
      parentPositionId: pos.parent_position_id,
      code: pos.code,
      titleEn: pos.title_en,
      titleAr: pos.title_ar,
      descriptionEn: pos.description_en,
      descriptionAr: pos.description_ar,
      governmentGrade: pos.government_grade,
      salaryScale: pos.salary_scale,
      status: pos.status,
      maxAttributes: pos.max_attributes,
      requiresSecurityClearance: pos.requires_security_clearance,
      isManagementPosition: pos.is_management_position,
      level: pos.level,
      ministry: {
        name: pos.ministry_name,
        code: pos.ministry_code
      },
      departmentName: pos.department_name,
      currentEmployee: pos.employee_id ? {
        id: pos.employee_id,
        firstName: pos.first_name,
        lastName: pos.last_name,
        firstNameAr: pos.first_name_ar,
        lastNameAr: pos.last_name_ar
      } : null,
      attributeCount: parseInt(pos.attribute_count),
      createdAt: pos.created_at,
      updatedAt: pos.updated_at
    }))

    res.json({
      success: true,
      data: {
        positions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  })
)

/**
 * @route   GET /api/v1/positions/:id
 * @desc    Get position by ID with full details
 * @access  Private
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Get position details
    const positionResult = await query(`
      SELECT p.id, p.ministry_id, p.department_id, p.parent_position_id,
             p.code, p.title_en, p.title_ar, p.description_en, p.description_ar,
             p.government_grade, p.salary_scale, p.status, p.max_attributes,
             p.requires_security_clearance, p.is_management_position, p.level,
             p.created_at, p.updated_at,
             m.name_en as ministry_name, m.code as ministry_code,
             d.name_en as department_name,
             pp.title_en as parent_position_title
      FROM positions p
      LEFT JOIN ministries m ON p.ministry_id = m.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN positions pp ON p.parent_position_id = pp.id
      WHERE p.id = $1
    `, [id])

    if (positionResult.rows.length === 0) {
      throw new NotFoundError('Position')
    }

    const position = positionResult.rows[0]

    // Get current employee
    const employeeResult = await query(`
      SELECT e.id, e.employee_number, e.first_name, e.last_name,
             e.first_name_ar, e.last_name_ar, e.email, e.phone,
             ep.start_date, ep.assignment_type
      FROM employee_positions ep
      JOIN employees e ON ep.employee_id = e.id
      WHERE ep.position_id = $1 AND ep.is_current = true
    `, [id])

    // Get position attributes
    const attributesResult = await query(`
      SELECT a.id, a.code, a.name_en, a.name_ar, a.type, a.category,
             pa.assigned_date, pa.expiry_date, pa.notes
      FROM position_attributes pa
      JOIN attributes a ON pa.attribute_id = a.id
      WHERE pa.position_id = $1 AND pa.is_active = true
      ORDER BY a.type, a.name_en
    `, [id])

    const positionData = {
      id: position.id,
      ministryId: position.ministry_id,
      departmentId: position.department_id,
      parentPositionId: position.parent_position_id,
      code: position.code,
      titleEn: position.title_en,
      titleAr: position.title_ar,
      descriptionEn: position.description_en,
      descriptionAr: position.description_ar,
      governmentGrade: position.government_grade,
      salaryScale: position.salary_scale,
      status: position.status,
      maxAttributes: position.max_attributes,
      requiresSecurityClearance: position.requires_security_clearance,
      isManagementPosition: position.is_management_position,
      level: position.level,
      ministry: {
        name: position.ministry_name,
        code: position.ministry_code
      },
      departmentName: position.department_name,
      parentPositionTitle: position.parent_position_title,
      currentEmployee: employeeResult.rows.length > 0 ? {
        id: employeeResult.rows[0].id,
        employeeNumber: employeeResult.rows[0].employee_number,
        firstName: employeeResult.rows[0].first_name,
        lastName: employeeResult.rows[0].last_name,
        firstNameAr: employeeResult.rows[0].first_name_ar,
        lastNameAr: employeeResult.rows[0].last_name_ar,
        email: employeeResult.rows[0].email,
        phone: employeeResult.rows[0].phone,
        startDate: employeeResult.rows[0].start_date,
        assignmentType: employeeResult.rows[0].assignment_type
      } : null,
      attributes: attributesResult.rows.map(attr => ({
        id: attr.id,
        code: attr.code,
        nameEn: attr.name_en,
        nameAr: attr.name_ar,
        type: attr.type,
        category: attr.category,
        assignedDate: attr.assigned_date,
        expiryDate: attr.expiry_date,
        notes: attr.notes
      })),
      createdAt: position.created_at,
      updatedAt: position.updated_at
    }

    res.json({
      success: true,
      data: positionData
    })
  })
)

/**
 * @route   POST /api/v1/positions
 * @desc    Create new position
 * @access  Private (Admin/Ministry Admin)
 */
router.post('/',
  authenticate,
  authorize('super_admin', 'ministry_admin'),
  validate(schemas.position.create),
  asyncHandler(async (req, res) => {
    const {
      ministry_id,
      department_id,
      parent_position_id,
      code,
      title_en,
      title_ar,
      description_en,
      description_ar,
      government_grade,
      salary_scale,
      max_attributes,
      requires_security_clearance,
      is_management_position,
      level
    } = req.body

    // Ministry access control
    if (req.user.role === 'ministry_admin' && req.user.ministry_id !== ministry_id) {
      throw new ValidationError('Cannot create position for different ministry')
    }

    // Check if position code is unique within ministry
    const existingResult = await query(
      'SELECT id FROM positions WHERE code = $1 AND ministry_id = $2',
      [code, ministry_id]
    )

    if (existingResult.rows.length > 0) {
      throw new ConflictError('Position code already exists in this ministry')
    }

    // Verify ministry exists
    const ministryResult = await query('SELECT id FROM ministries WHERE id = $1', [ministry_id])
    if (ministryResult.rows.length === 0) {
      throw new NotFoundError('Ministry')
    }

    // Verify department exists if provided
    if (department_id) {
      const deptResult = await query(
        'SELECT id FROM departments WHERE id = $1 AND ministry_id = $2',
        [department_id, ministry_id]
      )
      if (deptResult.rows.length === 0) {
        throw new NotFoundError('Department')
      }
    }

    // Verify parent position exists if provided
    if (parent_position_id) {
      const parentResult = await query(
        'SELECT id, level FROM positions WHERE id = $1 AND ministry_id = $2',
        [parent_position_id, ministry_id]
      )
      if (parentResult.rows.length === 0) {
        throw new NotFoundError('Parent position')
      }
    }

    // Generate new position ID
    const positionId = 'p' + Date.now().toString().slice(-12) + '-0000-0000-0000-000000000' + Math.floor(Math.random() * 100).toString().padStart(3, '0')

    await transaction(async (client) => {
      // Insert position
      await client.query(`
        INSERT INTO positions (
          id, ministry_id, department_id, parent_position_id, code,
          title_en, title_ar, description_en, description_ar,
          government_grade, salary_scale, max_attributes,
          requires_security_clearance, is_management_position, level,
          status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active', $16, $16)
      `, [
        positionId, ministry_id, department_id, parent_position_id, code,
        title_en, title_ar, description_en, description_ar,
        government_grade, salary_scale, max_attributes,
        requires_security_clearance, is_management_position, level,
        req.user.id
      ])

      // Log audit
      await client.query(`
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, $2, 'create', 'positions', $3, $4, $5, $6)
      `, [
        'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        req.user.id,
        positionId,
        JSON.stringify(req.body),
        req.ip,
        req.get('User-Agent')
      ])
    })

    logger.info('Position created', {
      positionId,
      code,
      ministryId: ministry_id,
      createdBy: req.user.id
    })

    res.status(201).json({
      success: true,
      message: 'Position created successfully',
      data: { id: positionId }
    })
  })
)

/**
 * @route   PUT /api/v1/positions/:id
 * @desc    Update position
 * @access  Private (Admin/Ministry Admin)
 */
router.put('/:id',
  authenticate,
  authorize('super_admin', 'ministry_admin'),
  validate(schemas.position.update),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Get existing position
    const positionResult = await query(
      'SELECT id, ministry_id, code FROM positions WHERE id = $1',
      [id]
    )

    if (positionResult.rows.length === 0) {
      throw new NotFoundError('Position')
    }

    const position = positionResult.rows[0]

    // Ministry access control
    if (req.user.role === 'ministry_admin' && req.user.ministry_id !== position.ministry_id) {
      throw new ValidationError('Cannot update position from different ministry')
    }

    const updates = []
    const values = []
    let paramCount = 0

    // Build dynamic update query
    const allowedFields = [
      'department_id', 'parent_position_id', 'code', 'title_en', 'title_ar',
      'description_en', 'description_ar', 'government_grade', 'salary_scale',
      'max_attributes', 'requires_security_clearance', 'is_management_position',
      'status'
    ]

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        paramCount++
        updates.push(`${field} = $${paramCount}`)
        values.push(req.body[field])
      }
    })

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update')
    }

    // Check code uniqueness if code is being updated
    if (req.body.code && req.body.code !== position.code) {
      const existingResult = await query(
        'SELECT id FROM positions WHERE code = $1 AND ministry_id = $2 AND id != $3',
        [req.body.code, position.ministry_id, id]
      )

      if (existingResult.rows.length > 0) {
        throw new ConflictError('Position code already exists in this ministry')
      }
    }

    paramCount++
    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    updates.push(`updated_by = $${paramCount}`)
    values.push(req.user.id)

    paramCount++
    values.push(id)

    await transaction(async (client) => {
      // Update position
      await client.query(`
        UPDATE positions
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
      `, values)

      // Log audit
      await client.query(`
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, $2, 'update', 'positions', $3, $4, $5, $6)
      `, [
        'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        req.user.id,
        id,
        JSON.stringify(req.body),
        req.ip,
        req.get('User-Agent')
      ])
    })

    logger.info('Position updated', {
      positionId: id,
      updatedBy: req.user.id,
      changes: req.body
    })

    res.json({
      success: true,
      message: 'Position updated successfully'
    })
  })
)

/**
 * @route   DELETE /api/v1/positions/:id
 * @desc    Delete position (soft delete)
 * @access  Private (Admin/Ministry Admin)
 */
router.delete('/:id',
  authenticate,
  authorize('super_admin', 'ministry_admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Get existing position
    const positionResult = await query(
      'SELECT id, ministry_id, code, status FROM positions WHERE id = $1',
      [id]
    )

    if (positionResult.rows.length === 0) {
      throw new NotFoundError('Position')
    }

    const position = positionResult.rows[0]

    // Ministry access control
    if (req.user.role === 'ministry_admin' && req.user.ministry_id !== position.ministry_id) {
      throw new ValidationError('Cannot delete position from different ministry')
    }

    // Check if position has active employees
    const employeeResult = await query(
      'SELECT id FROM employee_positions WHERE position_id = $1 AND is_current = true',
      [id]
    )

    if (employeeResult.rows.length > 0) {
      throw new ConflictError('Cannot delete position with active employees')
    }

    // Check if position has child positions
    const childResult = await query(
      'SELECT id FROM positions WHERE parent_position_id = $1 AND status = $2',
      [id, 'active']
    )

    if (childResult.rows.length > 0) {
      throw new ConflictError('Cannot delete position with active child positions')
    }

    await transaction(async (client) => {
      // Soft delete position
      await client.query(`
        UPDATE positions
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP, updated_by = $1
        WHERE id = $2
      `, [req.user.id, id])

      // Deactivate position attributes
      await client.query(`
        UPDATE position_attributes
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE position_id = $1
      `, [id])

      // Log audit
      await client.query(`
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, $2, 'delete', 'positions', $3, $4, $5, $6)
      `, [
        'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        req.user.id,
        id,
        JSON.stringify({ status: 'inactive' }),
        req.ip,
        req.get('User-Agent')
      ])
    })

    logger.info('Position deleted', {
      positionId: id,
      deletedBy: req.user.id
    })

    res.json({
      success: true,
      message: 'Position deleted successfully'
    })
  })
)

/**
 * @route   POST /api/v1/positions/:id/attributes
 * @desc    Assign attribute to position
 * @access  Private (Admin/Ministry Admin)
 */
router.post('/:id/attributes',
  authenticate,
  authorize('super_admin', 'ministry_admin'),
  validate(schemas.attribute.assignAttributeToPosition),
  asyncHandler(async (req, res) => {
    const { id: positionId } = req.params
    const { attribute_id, assigned_date, expiry_date, notes } = req.body

    // Get position
    const positionResult = await query(
      'SELECT id, ministry_id, max_attributes FROM positions WHERE id = $1 AND status = $2',
      [positionId, 'active']
    )

    if (positionResult.rows.length === 0) {
      throw new NotFoundError('Position')
    }

    const position = positionResult.rows[0]

    // Ministry access control
    if (req.user.role === 'ministry_admin' && req.user.ministry_id !== position.ministry_id) {
      throw new ValidationError('Cannot manage attributes for positions from different ministry')
    }

    // Check if attribute exists
    const attributeResult = await query('SELECT id FROM attributes WHERE id = $1', [attribute_id])
    if (attributeResult.rows.length === 0) {
      throw new NotFoundError('Attribute')
    }

    // Check if already assigned
    const existingResult = await query(
      'SELECT id FROM position_attributes WHERE position_id = $1 AND attribute_id = $2 AND is_active = true',
      [positionId, attribute_id]
    )

    if (existingResult.rows.length > 0) {
      throw new ConflictError('Attribute already assigned to this position')
    }

    // Check attribute limit
    const currentAttributesResult = await query(
      'SELECT COUNT(*) as count FROM position_attributes WHERE position_id = $1 AND is_active = true',
      [positionId]
    )

    if (parseInt(currentAttributesResult.rows[0].count) >= position.max_attributes) {
      throw new ConflictError(`Position has reached maximum attribute limit (${position.max_attributes})`)
    }

    const assignmentId = 'pa' + Date.now().toString().slice(-12) + '-0000-0000-0000-000000000' + Math.floor(Math.random() * 100).toString().padStart(3, '0')

    await transaction(async (client) => {
      // Insert position attribute
      await client.query(`
        INSERT INTO position_attributes (
          id, position_id, attribute_id, assigned_date, expiry_date, notes, is_active, assigned_by
        ) VALUES ($1, $2, $3, $4, $5, $6, true, $7)
      `, [assignmentId, positionId, attribute_id, assigned_date, expiry_date, notes, req.user.id])

      // Log audit
      await client.query(`
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, $2, 'create', 'position_attributes', $3, $4, $5, $6)
      `, [
        'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        req.user.id,
        assignmentId,
        JSON.stringify({ position_id: positionId, attribute_id, assigned_date, expiry_date, notes }),
        req.ip,
        req.get('User-Agent')
      ])
    })

    logger.info('Attribute assigned to position', {
      positionId,
      attributeId: attribute_id,
      assignedBy: req.user.id
    })

    res.status(201).json({
      success: true,
      message: 'Attribute assigned successfully',
      data: { id: assignmentId }
    })
  })
)

/**
 * @route   DELETE /api/v1/positions/:positionId/attributes/:attributeId
 * @desc    Remove attribute from position
 * @access  Private (Admin/Ministry Admin)
 */
router.delete('/:positionId/attributes/:attributeId',
  authenticate,
  authorize('super_admin', 'ministry_admin'),
  asyncHandler(async (req, res) => {
    const { positionId, attributeId } = req.params

    // Get position
    const positionResult = await query(
      'SELECT id, ministry_id FROM positions WHERE id = $1',
      [positionId]
    )

    if (positionResult.rows.length === 0) {
      throw new NotFoundError('Position')
    }

    const position = positionResult.rows[0]

    // Ministry access control
    if (req.user.role === 'ministry_admin' && req.user.ministry_id !== position.ministry_id) {
      throw new ValidationError('Cannot manage attributes for positions from different ministry')
    }

    // Check if assignment exists
    const assignmentResult = await query(
      'SELECT id FROM position_attributes WHERE position_id = $1 AND attribute_id = $2 AND is_active = true',
      [positionId, attributeId]
    )

    if (assignmentResult.rows.length === 0) {
      throw new NotFoundError('Attribute assignment')
    }

    const assignmentId = assignmentResult.rows[0].id

    await transaction(async (client) => {
      // Deactivate assignment
      await client.query(`
        UPDATE position_attributes
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [assignmentId])

      // Log audit
      await client.query(`
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, $2, 'delete', 'position_attributes', $3, $4, $5, $6)
      `, [
        'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        req.user.id,
        assignmentId,
        JSON.stringify({ is_active: false }),
        req.ip,
        req.get('User-Agent')
      ])
    })

    logger.info('Attribute removed from position', {
      positionId,
      attributeId,
      removedBy: req.user.id
    })

    res.json({
      success: true,
      message: 'Attribute removed successfully'
    })
  })
)

module.exports = router