const express = require('express')
const { query } = require('../config/database')
const { authenticate, authorize, authorizeMinistry } = require('../middleware/auth')
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler')

const router = express.Router()

/**
 * @route   GET /api/v1/departments
 * @desc    Get departments with filtering
 * @access  Private
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { ministry_id, parent_id, active_only = true } = req.query

    let whereConditions = []
    let queryParams = []
    let paramCount = 0

    if (active_only === 'true') {
      whereConditions.push('d.is_active = true')
    }

    if (ministry_id) {
      paramCount++
      whereConditions.push(`d.ministry_id = $${paramCount}`)
      queryParams.push(ministry_id)
    }

    if (parent_id) {
      paramCount++
      whereConditions.push(`d.parent_department_id = $${paramCount}`)
      queryParams.push(parent_id)
    }

    // Ministry access control
    if (req.user.role !== 'super_admin' && req.user.ministry_id) {
      paramCount++
      whereConditions.push(`d.ministry_id = $${paramCount}`)
      queryParams.push(req.user.ministry_id)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const result = await query(`
      SELECT d.id, d.ministry_id, d.parent_department_id, d.code, d.name_en, d.name_ar,
             d.description_en, d.description_ar, d.level, d.is_active, d.display_order,
             d.created_at, d.updated_at,
             m.name_en as ministry_name, m.code as ministry_code,
             pd.name_en as parent_name,
             COUNT(cd.id) as child_count
      FROM departments d
      LEFT JOIN ministries m ON d.ministry_id = m.id
      LEFT JOIN departments pd ON d.parent_department_id = pd.id
      LEFT JOIN departments cd ON d.id = cd.parent_department_id AND cd.is_active = true
      ${whereClause}
      GROUP BY d.id, d.ministry_id, d.parent_department_id, d.code, d.name_en, d.name_ar,
               d.description_en, d.description_ar, d.level, d.is_active, d.display_order,
               d.created_at, d.updated_at, m.name_en, m.code, pd.name_en
      ORDER BY d.display_order ASC, d.name_en ASC
    `, queryParams)

    const departments = result.rows.map(dept => ({
      id: dept.id,
      ministryId: dept.ministry_id,
      parentDepartmentId: dept.parent_department_id,
      code: dept.code,
      nameEn: dept.name_en,
      nameAr: dept.name_ar,
      descriptionEn: dept.description_en,
      descriptionAr: dept.description_ar,
      level: dept.level,
      isActive: dept.is_active,
      displayOrder: dept.display_order,
      ministry: {
        name: dept.ministry_name,
        code: dept.ministry_code
      },
      parentName: dept.parent_name,
      childCount: parseInt(dept.child_count),
      createdAt: dept.created_at,
      updatedAt: dept.updated_at
    }))

    res.json({
      success: true,
      data: departments
    })
  })
)

/**
 * @route   GET /api/v1/departments/:id
 * @desc    Get department by ID
 * @access  Private
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const result = await query(`
      SELECT d.id, d.ministry_id, d.parent_department_id, d.code, d.name_en, d.name_ar,
             d.description_en, d.description_ar, d.level, d.is_active, d.display_order,
             d.created_at, d.updated_at,
             m.name_en as ministry_name, m.code as ministry_code,
             pd.name_en as parent_name
      FROM departments d
      LEFT JOIN ministries m ON d.ministry_id = m.id
      LEFT JOIN departments pd ON d.parent_department_id = pd.id
      WHERE d.id = $1
    `, [id])

    if (result.rows.length === 0) {
      throw new NotFoundError('Department')
    }

    const dept = result.rows[0]

    res.json({
      success: true,
      data: {
        id: dept.id,
        ministryId: dept.ministry_id,
        parentDepartmentId: dept.parent_department_id,
        code: dept.code,
        nameEn: dept.name_en,
        nameAr: dept.name_ar,
        descriptionEn: dept.description_en,
        descriptionAr: dept.description_ar,
        level: dept.level,
        isActive: dept.is_active,
        displayOrder: dept.display_order,
        ministry: {
          name: dept.ministry_name,
          code: dept.ministry_code
        },
        parentName: dept.parent_name,
        createdAt: dept.created_at,
        updatedAt: dept.updated_at
      }
    })
  })
)

module.exports = router