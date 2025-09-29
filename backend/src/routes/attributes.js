const express = require('express')
const { query, transaction } = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { validate, schemas } = require('../middleware/validation')
const { asyncHandler, NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler')
const logger = require('../config/logger')

const router = express.Router()

/**
 * @route   GET /api/v1/attributes
 * @desc    Get all attributes
 * @access  Private
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { type, category, active_only = true } = req.query

    let whereConditions = []
    let queryParams = []
    let paramCount = 0

    if (active_only === 'true') {
      whereConditions.push('a.is_active = true')
    }

    if (type) {
      paramCount++
      whereConditions.push(`a.type = $${paramCount}`)
      queryParams.push(type)
    }

    if (category) {
      paramCount++
      whereConditions.push(`a.category = $${paramCount}`)
      queryParams.push(category)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const result = await query(`
      SELECT a.id, a.code, a.name_en, a.name_ar, a.description_en, a.description_ar,
             a.type, a.category, a.is_active, a.requires_approval, a.display_order,
             a.created_at, a.updated_at,
             COUNT(pa.id) as usage_count
      FROM attributes a
      LEFT JOIN position_attributes pa ON a.id = pa.attribute_id AND pa.is_active = true
      ${whereClause}
      GROUP BY a.id, a.code, a.name_en, a.name_ar, a.description_en, a.description_ar,
               a.type, a.category, a.is_active, a.requires_approval, a.display_order,
               a.created_at, a.updated_at
      ORDER BY a.type, a.display_order, a.name_en
    `, queryParams)

    const attributes = result.rows.map(attr => ({
      id: attr.id,
      code: attr.code,
      nameEn: attr.name_en,
      nameAr: attr.name_ar,
      descriptionEn: attr.description_en,
      descriptionAr: attr.description_ar,
      type: attr.type,
      category: attr.category,
      isActive: attr.is_active,
      requiresApproval: attr.requires_approval,
      displayOrder: attr.display_order,
      usageCount: parseInt(attr.usage_count),
      createdAt: attr.created_at,
      updatedAt: attr.updated_at
    }))

    res.json({
      success: true,
      data: attributes
    })
  })
)

/**
 * @route   GET /api/v1/attributes/:id
 * @desc    Get single attribute by ID
 * @access  Private
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const result = await query(`
      SELECT a.id, a.code, a.name_en, a.name_ar, a.description_en, a.description_ar,
             a.type, a.category, a.is_active, a.requires_approval, a.display_order,
             a.created_at, a.updated_at,
             COUNT(pa.id) as usage_count
      FROM attributes a
      LEFT JOIN position_attributes pa ON a.id = pa.attribute_id AND pa.is_active = true
      WHERE a.id = $1
      GROUP BY a.id, a.code, a.name_en, a.name_ar, a.description_en, a.description_ar,
               a.type, a.category, a.is_active, a.requires_approval, a.display_order,
               a.created_at, a.updated_at
    `, [id])

    if (result.rows.length === 0) {
      throw new NotFoundError('Attribute')
    }

    const attr = result.rows[0]

    // Get positions using this attribute
    const positionsResult = await query(`
      SELECT p.id, p.code, p.title_en, p.title_ar, m.name_en as ministry_name,
             pa.assigned_date, pa.expiry_date, pa.notes
      FROM position_attributes pa
      JOIN positions p ON pa.position_id = p.id
      JOIN ministries m ON p.ministry_id = m.id
      WHERE pa.attribute_id = $1 AND pa.is_active = true
      ORDER BY m.name_en, p.title_en
    `, [id])

    const attributeData = {
      id: attr.id,
      code: attr.code,
      nameEn: attr.name_en,
      nameAr: attr.name_ar,
      descriptionEn: attr.description_en,
      descriptionAr: attr.description_ar,
      type: attr.type,
      category: attr.category,
      isActive: attr.is_active,
      requiresApproval: attr.requires_approval,
      displayOrder: attr.display_order,
      usageCount: parseInt(attr.usage_count),
      positions: positionsResult.rows.map(pos => ({
        id: pos.id,
        code: pos.code,
        titleEn: pos.title_en,
        titleAr: pos.title_ar,
        ministryName: pos.ministry_name,
        assignedDate: pos.assigned_date,
        expiryDate: pos.expiry_date,
        notes: pos.notes
      })),
      createdAt: attr.created_at,
      updatedAt: attr.updated_at
    }

    res.json({
      success: true,
      data: attributeData
    })
  })
)

/**
 * @route   POST /api/v1/attributes
 * @desc    Create new attribute
 * @access  Private (Admin only)
 */
router.post('/',
  authenticate,
  authorize('super_admin'),
  validate(schemas.attribute.create),
  asyncHandler(async (req, res) => {
    const {
      code,
      name_en,
      name_ar,
      description_en,
      description_ar,
      type,
      category,
      requires_approval
    } = req.body

    // Check if code is unique
    const existingResult = await query('SELECT id FROM attributes WHERE code = $1', [code])
    if (existingResult.rows.length > 0) {
      throw new ConflictError('Attribute code already exists')
    }

    // Get next display order
    const orderResult = await query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM attributes WHERE type = $1',
      [type]
    )
    const displayOrder = orderResult.rows[0].next_order

    // Generate new attribute ID
    const attributeId = 'a' + Date.now().toString().slice(-12) + '-0000-0000-0000-000000000' + Math.floor(Math.random() * 100).toString().padStart(3, '0')

    await transaction(async (client) => {
      // Insert attribute
      await client.query(`
        INSERT INTO attributes (
          id, code, name_en, name_ar, description_en, description_ar,
          type, category, requires_approval, display_order, is_active, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $11)
      `, [
        attributeId, code, name_en, name_ar, description_en, description_ar,
        type, category, requires_approval, displayOrder, req.user.id
      ])

      // Log audit
      await client.query(`
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, $2, 'create', 'attributes', $3, $4, $5, $6)
      `, [
        'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        req.user.id,
        attributeId,
        JSON.stringify(req.body),
        req.ip,
        req.get('User-Agent')
      ])
    })

    logger.info('Attribute created', {
      attributeId,
      code,
      type,
      createdBy: req.user.id
    })

    res.status(201).json({
      success: true,
      message: 'Attribute created successfully',
      data: { id: attributeId }
    })
  })
)

/**
 * @route   PUT /api/v1/attributes/:id
 * @desc    Update attribute
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticate,
  authorize('super_admin'),
  validate(schemas.attribute.update),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Get existing attribute
    const attributeResult = await query('SELECT id, code FROM attributes WHERE id = $1', [id])

    if (attributeResult.rows.length === 0) {
      throw new NotFoundError('Attribute')
    }

    const updates = []
    const values = []
    let paramCount = 0

    // Build dynamic update query
    const allowedFields = [
      'name_en', 'name_ar', 'description_en', 'description_ar',
      'type', 'category', 'requires_approval', 'is_active'
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

    paramCount++
    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    updates.push(`updated_by = $${paramCount}`)
    values.push(req.user.id)

    paramCount++
    values.push(id)

    await transaction(async (client) => {
      // Update attribute
      await client.query(`
        UPDATE attributes
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
      `, values)

      // Log audit
      await client.query(`
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, $2, 'update', 'attributes', $3, $4, $5, $6)
      `, [
        'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        req.user.id,
        id,
        JSON.stringify(req.body),
        req.ip,
        req.get('User-Agent')
      ])
    })

    logger.info('Attribute updated', {
      attributeId: id,
      updatedBy: req.user.id,
      changes: req.body
    })

    res.json({
      success: true,
      message: 'Attribute updated successfully'
    })
  })
)

/**
 * @route   DELETE /api/v1/attributes/:id
 * @desc    Delete attribute (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Get existing attribute
    const attributeResult = await query(
      'SELECT id, code, is_active FROM attributes WHERE id = $1',
      [id]
    )

    if (attributeResult.rows.length === 0) {
      throw new NotFoundError('Attribute')
    }

    const attribute = attributeResult.rows[0]

    // Check if attribute is currently assigned to positions
    const usageResult = await query(
      'SELECT COUNT(*) as count FROM position_attributes WHERE attribute_id = $1 AND is_active = true',
      [id]
    )

    if (parseInt(usageResult.rows[0].count) > 0) {
      throw new ConflictError('Cannot delete attribute that is currently assigned to positions')
    }

    await transaction(async (client) => {
      // Soft delete attribute
      await client.query(`
        UPDATE attributes
        SET is_active = false, updated_at = CURRENT_TIMESTAMP, updated_by = $1
        WHERE id = $2
      `, [req.user.id, id])

      // Log audit
      await client.query(`
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES ($1, $2, 'delete', 'attributes', $3, $4, $5, $6)
      `, [
        'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        req.user.id,
        id,
        JSON.stringify({ is_active: false }),
        req.ip,
        req.get('User-Agent')
      ])
    })

    logger.info('Attribute deleted', {
      attributeId: id,
      deletedBy: req.user.id
    })

    res.json({
      success: true,
      message: 'Attribute deleted successfully'
    })
  })
)

module.exports = router