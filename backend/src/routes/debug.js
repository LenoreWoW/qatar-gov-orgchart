const express = require('express')
const { query } = require('../config/database')
const { cache } = require('../config/redis')
const { authenticate, authorize } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

const router = express.Router()

/**
 * @route   GET /api/v1/debug/status
 * @desc    Get system status for debugging
 * @access  Private (super_admin only)
 */
router.get('/status',
  authenticate,
  authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const dbStats = await query('SELECT version() as db_version, current_database() as db_name')

    res.json({
      success: true,
      data: {
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        database: dbStats.rows[0],
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    })
  })
)

module.exports = router