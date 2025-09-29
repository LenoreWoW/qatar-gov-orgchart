const express = require('express')
const { query } = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

const router = express.Router()

/**
 * @route   GET /api/v1/reports/summary
 * @desc    Get summary statistics
 * @access  Private
 */
router.get('/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const { ministry_id } = req.query

    let ministryFilter = ''
    let queryParams = []

    if (ministry_id) {
      ministryFilter = 'WHERE p.ministry_id = $1'
      queryParams.push(ministry_id)
    } else if (req.user.role !== 'super_admin' && req.user.ministry_id) {
      ministryFilter = 'WHERE p.ministry_id = $1'
      queryParams.push(req.user.ministry_id)
    }

    const summaryQuery = `
      SELECT
        COUNT(DISTINCT m.id) as total_ministries,
        COUNT(DISTINCT d.id) as total_departments,
        COUNT(DISTINCT p.id) as total_positions,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT CASE WHEN p.status = 'vacant' THEN p.id END) as vacant_positions,
        COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as filled_positions,
        COUNT(DISTINCT a.id) as total_attributes
      FROM positions p
      LEFT JOIN ministries m ON p.ministry_id = m.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN employee_positions ep ON p.id = ep.position_id AND ep.is_current = true
      LEFT JOIN employees e ON ep.employee_id = e.id
      LEFT JOIN position_attributes pa ON p.id = pa.position_id AND pa.is_active = true
      LEFT JOIN attributes a ON pa.attribute_id = a.id
      ${ministryFilter}
    `

    const result = await query(summaryQuery, queryParams)
    const summary = result.rows[0]

    res.json({
      success: true,
      data: {
        totalMinistries: parseInt(summary.total_ministries),
        totalDepartments: parseInt(summary.total_departments),
        totalPositions: parseInt(summary.total_positions),
        totalEmployees: parseInt(summary.total_employees),
        vacantPositions: parseInt(summary.vacant_positions),
        filledPositions: parseInt(summary.filled_positions),
        totalAttributes: parseInt(summary.total_attributes),
        occupancyRate: summary.total_positions > 0
          ? ((summary.filled_positions / summary.total_positions) * 100).toFixed(1)
          : 0
      }
    })
  })
)

module.exports = router