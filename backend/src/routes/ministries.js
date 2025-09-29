const express = require('express')
const { query, transaction } = require('../config/database')
const { orgCache } = require('../config/redis')
const logger = require('../config/logger')
const { validate, schemas } = require('../middleware/validation')
const { authenticate, authorize, authorizeMinistry } = require('../middleware/auth')
const { asyncHandler, NotFoundError, ConflictError } = require('../middleware/errorHandler')

const router = express.Router()

/**
 * @route   GET /api/v1/ministries
 * @desc    Get all ministries
 * @access  Private
 */
router.get('/',
  authenticate,
  validate(schemas.query.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, q } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE m.is_active = true'
    let queryParams = []
    let paramCount = 0

    if (q) {
      paramCount++
      whereClause += ` AND (m.name_en ILIKE $${paramCount} OR m.name_ar ILIKE $${paramCount} OR m.code ILIKE $${paramCount})`
      queryParams.push(`%${q}%`)
    }

    // Ministry access control
    if (req.user.role !== 'super_admin' && req.user.ministry_id) {
      paramCount++
      whereClause += ` AND m.id = $${paramCount}`
      queryParams.push(req.user.ministry_id)
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM ministries m ${whereClause}`, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get ministries
    paramCount++
    queryParams.push(limit)
    paramCount++
    queryParams.push(offset)

    const ministriesResult = await query(`
      SELECT m.id, m.code, m.name_en, m.name_ar, m.description_en, m.description_ar,
             m.website, m.phone, m.email, m.address_en, m.address_ar, m.is_active,
             m.display_order, m.created_at, m.updated_at,
             COUNT(d.id) as department_count,
             COUNT(u.id) as user_count
      FROM ministries m
      LEFT JOIN departments d ON m.id = d.ministry_id AND d.is_active = true
      LEFT JOIN users u ON m.id = u.ministry_id AND u.status = 'active'
      ${whereClause}
      GROUP BY m.id, m.code, m.name_en, m.name_ar, m.description_en, m.description_ar,
               m.website, m.phone, m.email, m.address_en, m.address_ar, m.is_active,
               m.display_order, m.created_at, m.updated_at
      ORDER BY m.display_order ASC, m.name_en ASC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, queryParams)

    const ministries = ministriesResult.rows.map(ministry => ({
      id: ministry.id,
      code: ministry.code,
      nameEn: ministry.name_en,
      nameAr: ministry.name_ar,
      descriptionEn: ministry.description_en,
      descriptionAr: ministry.description_ar,
      website: ministry.website,
      phone: ministry.phone,
      email: ministry.email,
      addressEn: ministry.address_en,
      addressAr: ministry.address_ar,
      isActive: ministry.is_active,
      displayOrder: ministry.display_order,
      departmentCount: parseInt(ministry.department_count),
      userCount: parseInt(ministry.user_count),
      createdAt: ministry.created_at,
      updatedAt: ministry.updated_at
    }))

    res.json({
      success: true,
      data: {
        ministries,
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
 * @route   GET /api/v1/ministries/:id
 * @desc    Get ministry by ID
 * @access  Private
 */
router.get('/:id',
  authenticate,
  authorizeMinistry,
  validate(schemas.params.id, 'params'),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const ministryResult = await query(`
      SELECT m.id, m.code, m.name_en, m.name_ar, m.description_en, m.description_ar,
             m.website, m.phone, m.email, m.address_en, m.address_ar, m.is_active,
             m.display_order, m.created_at, m.updated_at,
             COUNT(DISTINCT d.id) as department_count,
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT p.id) as position_count
      FROM ministries m
      LEFT JOIN departments d ON m.id = d.ministry_id AND d.is_active = true
      LEFT JOIN users u ON m.id = u.ministry_id AND u.status = 'active'
      LEFT JOIN positions p ON m.id = p.ministry_id
      WHERE m.id = $1
      GROUP BY m.id, m.code, m.name_en, m.name_ar, m.description_en, m.description_ar,
               m.website, m.phone, m.email, m.address_en, m.address_ar, m.is_active,
               m.display_order, m.created_at, m.updated_at
    `, [id])

    if (ministryResult.rows.length === 0) {
      throw new NotFoundError('Ministry')
    }

    const ministry = ministryResult.rows[0]

    res.json({
      success: true,
      data: {
        id: ministry.id,
        code: ministry.code,
        nameEn: ministry.name_en,
        nameAr: ministry.name_ar,
        descriptionEn: ministry.description_en,
        descriptionAr: ministry.description_ar,
        website: ministry.website,
        phone: ministry.phone,
        email: ministry.email,
        addressEn: ministry.address_en,
        addressAr: ministry.address_ar,
        isActive: ministry.is_active,
        displayOrder: ministry.display_order,
        stats: {
          departmentCount: parseInt(ministry.department_count),
          userCount: parseInt(ministry.user_count),
          positionCount: parseInt(ministry.position_count)
        },
        createdAt: ministry.created_at,
        updatedAt: ministry.updated_at
      }
    })
  })
)

/**
 * @route   POST /api/v1/ministries
 * @desc    Create new ministry
 * @access  Private (super_admin only)
 */
router.post('/',
  authenticate,
  authorize('super_admin'),
  validate(schemas.ministry.create),
  asyncHandler(async (req, res) => {
    const ministryData = req.body
    const currentUser = req.user

    // Check for existing code
    const existingMinistry = await query(
      'SELECT id FROM ministries WHERE code = $1',
      [ministryData.code]
    )

    if (existingMinistry.rows.length > 0) {
      throw new ConflictError('Ministry code already exists')
    }

    const result = await query(`
      INSERT INTO ministries (
        code, name_en, name_ar, description_en, description_ar,
        website, phone, email, address_en, address_ar,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
      RETURNING *
    `, [
      ministryData.code, ministryData.name_en, ministryData.name_ar,
      ministryData.description_en, ministryData.description_ar,
      ministryData.website, ministryData.phone, ministryData.email,
      ministryData.address_en, ministryData.address_ar,
      currentUser.id
    ])

    logger.info('Ministry created', {
      ministryId: result.rows[0].id,
      code: result.rows[0].code,
      createdBy: currentUser.username
    })

    res.status(201).json({
      success: true,
      message: 'Ministry created successfully',
      data: result.rows[0]
    })
  })
)

/**
 * @route   PUT /api/v1/ministries/:id
 * @desc    Update ministry
 * @access  Private (super_admin, ministry_admin)
 */
router.put('/:id',
  authenticate,
  authorize('super_admin', 'ministry_admin'),
  authorizeMinistry,
  validate(schemas.params.id, 'params'),
  validate(schemas.ministry.update),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const updateData = req.body
    const currentUser = req.user

    // Check if ministry exists
    const existingMinistry = await query('SELECT id FROM ministries WHERE id = $1', [id])
    if (existingMinistry.rows.length === 0) {
      throw new NotFoundError('Ministry')
    }

    // Build update query
    const updateFields = Object.keys(updateData)
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ')
    const values = updateFields.map(field => updateData[field])
    values.push(currentUser.id) // updated_by
    values.push(id) // WHERE clause

    const updateQuery = `
      UPDATE ministries
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP, updated_by = $${values.length - 1}
      WHERE id = $${values.length}
      RETURNING *
    `

    const result = await query(updateQuery, values)

    // Invalidate organization cache
    await orgCache.invalidateOrgCache(id)

    logger.info('Ministry updated', {
      ministryId: id,
      updatedFields: updateFields,
      updatedBy: currentUser.username
    })

    res.json({
      success: true,
      message: 'Ministry updated successfully',
      data: result.rows[0]
    })
  })
)

module.exports = router