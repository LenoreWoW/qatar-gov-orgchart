const express = require('express')
const { query } = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

const router = express.Router()

/**
 * @route   GET /api/v1/settings
 * @desc    Get system settings
 * @access  Private
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT setting_key, setting_value, description, is_public
      FROM system_settings
      WHERE is_public = true OR $1 = 'super_admin'
      ORDER BY setting_key
    `, [req.user.role])

    const settings = {}
    result.rows.forEach(setting => {
      settings[setting.setting_key] = {
        value: setting.setting_value,
        description: setting.description,
        isPublic: setting.is_public
      }
    })

    res.json({
      success: true,
      data: settings
    })
  })
)

module.exports = router