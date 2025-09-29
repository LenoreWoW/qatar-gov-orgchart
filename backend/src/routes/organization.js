const express = require('express')
const { query } = require('../config/database')
const { orgCache } = require('../config/redis')
const { authenticate } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

const router = express.Router()

/**
 * @route   GET /api/v1/organization/hierarchy/:ministryId
 * @desc    Get complete organization hierarchy for a ministry
 * @access  Private
 */
router.get('/hierarchy/:ministryId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { ministryId } = req.params

    // Check cache first
    const cachedHierarchy = await orgCache.getOrgHierarchy(ministryId)
    if (cachedHierarchy) {
      return res.json({
        success: true,
        data: cachedHierarchy,
        cached: true
      })
    }

    // Build hierarchy from database
    const hierarchyQuery = `
      WITH RECURSIVE org_hierarchy AS (
        -- Base case: Top-level positions (no parent)
        SELECT p.id, p.ministry_id, p.department_id, p.parent_position_id,
               p.code, p.title_en, p.title_ar, p.government_grade, p.level,
               p.is_management_position, p.status,
               e.id as employee_id, e.first_name, e.last_name,
               e.first_name_ar, e.last_name_ar,
               d.name_en as department_name, d.name_ar as department_name_ar,
               0 as depth
        FROM positions p
        LEFT JOIN employee_positions ep ON p.id = ep.position_id AND ep.is_current = true
        LEFT JOIN employees e ON ep.employee_id = e.id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.ministry_id = $1 AND p.parent_position_id IS NULL

        UNION ALL

        -- Recursive case: Child positions
        SELECT p.id, p.ministry_id, p.department_id, p.parent_position_id,
               p.code, p.title_en, p.title_ar, p.government_grade, p.level,
               p.is_management_position, p.status,
               e.id as employee_id, e.first_name, e.last_name,
               e.first_name_ar, e.last_name_ar,
               d.name_en as department_name, d.name_ar as department_name_ar,
               oh.depth + 1
        FROM positions p
        JOIN org_hierarchy oh ON p.parent_position_id = oh.id
        LEFT JOIN employee_positions ep ON p.id = ep.position_id AND ep.is_current = true
        LEFT JOIN employees e ON ep.employee_id = e.id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.ministry_id = $1
      )
      SELECT * FROM org_hierarchy
      ORDER BY depth, government_grade DESC, title_en
    `

    const result = await query(hierarchyQuery, [ministryId])

    // Get position attributes
    const attributesQuery = `
      SELECT pa.position_id, a.id, a.code, a.name_en, a.name_ar, a.type
      FROM position_attributes pa
      JOIN attributes a ON pa.attribute_id = a.id
      JOIN positions p ON pa.position_id = p.id
      WHERE p.ministry_id = $1 AND pa.is_active = true
      ORDER BY a.type, a.name_en
    `

    const attributesResult = await query(attributesQuery, [ministryId])

    // Group attributes by position
    const attributesByPosition = {}
    attributesResult.rows.forEach(attr => {
      if (!attributesByPosition[attr.position_id]) {
        attributesByPosition[attr.position_id] = []
      }
      attributesByPosition[attr.position_id].push({
        id: attr.id,
        code: attr.code,
        nameEn: attr.name_en,
        nameAr: attr.name_ar,
        type: attr.type
      })
    })

    // Build hierarchical structure
    const buildHierarchy = (positions, parentId = null, depth = 0) => {
      return positions
        .filter(pos => pos.parent_position_id === parentId)
        .map(pos => ({
          id: pos.id,
          code: pos.code,
          titleEn: pos.title_en,
          titleAr: pos.title_ar,
          governmentGrade: pos.government_grade,
          level: pos.level,
          isManagementPosition: pos.is_management_position,
          status: pos.status,
          department: pos.department_id ? {
            id: pos.department_id,
            nameEn: pos.department_name,
            nameAr: pos.department_name_ar
          } : null,
          currentEmployee: pos.employee_id ? {
            id: pos.employee_id,
            firstName: pos.first_name,
            lastName: pos.last_name,
            firstNameAr: pos.first_name_ar,
            lastNameAr: pos.last_name_ar
          } : null,
          attributes: attributesByPosition[pos.id] || [],
          children: buildHierarchy(positions, pos.id, depth + 1),
          depth
        }))
    }

    const hierarchy = buildHierarchy(result.rows)

    // Cache the result
    await orgCache.setOrgHierarchy(ministryId, hierarchy)

    res.json({
      success: true,
      data: hierarchy,
      cached: false
    })
  })
)

module.exports = router