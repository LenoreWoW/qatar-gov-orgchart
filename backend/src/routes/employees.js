const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler')

const router = express.Router()

/**
 * @route   GET /api/v1/employees
 * @desc    Get employees with filtering
 * @access  Private
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { ministry_id, department_id, active_only = true, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let whereConditions = []
    let queryParams = []
    let paramCount = 0

    if (active_only === 'true') {
      whereConditions.push('e.is_active = true')
    }

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

    // Ministry access control
    if (req.user.role !== 'super_admin' && req.user.ministry_id) {
      paramCount++
      whereConditions.push(`p.ministry_id = $${paramCount}`)
      queryParams.push(req.user.ministry_id)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM employees e
      LEFT JOIN employee_positions ep ON e.id = ep.employee_id AND ep.is_current = true
      LEFT JOIN positions p ON ep.position_id = p.id
      ${whereClause}
    `
    const countResult = await query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get employees
    paramCount++
    queryParams.push(limit)
    paramCount++
    queryParams.push(offset)

    const employeesQuery = `
      SELECT DISTINCT e.id, e.employee_number, e.national_id, e.first_name, e.last_name,
             e.first_name_ar, e.last_name_ar, e.email, e.phone, e.mobile,
             e.birth_date, e.hire_date, e.nationality, e.gender, e.marital_status,
             e.is_active, e.created_at, e.updated_at,
             p.id as position_id, p.title_en as position_title, p.title_ar as position_title_ar,
             p.government_grade, d.name_en as department_name, m.name_en as ministry_name
      FROM employees e
      LEFT JOIN employee_positions ep ON e.id = ep.employee_id AND ep.is_current = true
      LEFT JOIN positions p ON ep.position_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN ministries m ON p.ministry_id = m.id
      ${whereClause}
      ORDER BY e.first_name ASC, e.last_name ASC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `

    const result = await query(employeesQuery, queryParams)

    const employees = result.rows.map(emp => ({
      id: emp.id,
      employeeNumber: emp.employee_number,
      nationalId: emp.national_id,
      firstName: emp.first_name,
      lastName: emp.last_name,
      firstNameAr: emp.first_name_ar,
      lastNameAr: emp.last_name_ar,
      email: emp.email,
      phone: emp.phone,
      mobile: emp.mobile,
      birthDate: emp.birth_date,
      hireDate: emp.hire_date,
      nationality: emp.nationality,
      gender: emp.gender,
      maritalStatus: emp.marital_status,
      isActive: emp.is_active,
      currentPosition: emp.position_id ? {
        id: emp.position_id,
        titleEn: emp.position_title,
        titleAr: emp.position_title_ar,
        governmentGrade: emp.government_grade,
        departmentName: emp.department_name,
        ministryName: emp.ministry_name
      } : null,
      createdAt: emp.created_at,
      updatedAt: emp.updated_at
    }))

    res.json({
      success: true,
      data: {
        employees,
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
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee by ID
 * @access  Private
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const result = await query(`
      SELECT e.id, e.employee_number, e.national_id, e.first_name, e.last_name,
             e.first_name_ar, e.last_name_ar, e.email, e.phone, e.mobile,
             e.birth_date, e.hire_date, e.nationality, e.gender, e.marital_status,
             e.photo_url, e.emergency_contact_name, e.emergency_contact_phone,
             e.is_active, e.termination_date, e.termination_reason,
             e.created_at, e.updated_at
      FROM employees e
      WHERE e.id = $1
    `, [id])

    if (result.rows.length === 0) {
      throw new NotFoundError('Employee')
    }

    const employee = result.rows[0]

    // Get position history
    const positionsResult = await query(`
      SELECT ep.id, ep.start_date, ep.end_date, ep.assignment_type, ep.is_current,
             p.id as position_id, p.title_en, p.title_ar, p.government_grade,
             d.name_en as department_name, m.name_en as ministry_name
      FROM employee_positions ep
      JOIN positions p ON ep.position_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN ministries m ON p.ministry_id = m.id
      WHERE ep.employee_id = $1
      ORDER BY ep.start_date DESC
    `, [id])

    const employeeData = {
      id: employee.id,
      employeeNumber: employee.employee_number,
      nationalId: employee.national_id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      firstNameAr: employee.first_name_ar,
      lastNameAr: employee.last_name_ar,
      email: employee.email,
      phone: employee.phone,
      mobile: employee.mobile,
      birthDate: employee.birth_date,
      hireDate: employee.hire_date,
      nationality: employee.nationality,
      gender: employee.gender,
      maritalStatus: employee.marital_status,
      photoUrl: employee.photo_url,
      emergencyContactName: employee.emergency_contact_name,
      emergencyContactPhone: employee.emergency_contact_phone,
      isActive: employee.is_active,
      terminationDate: employee.termination_date,
      terminationReason: employee.termination_reason,
      positions: positionsResult.rows.map(pos => ({
        id: pos.id,
        positionId: pos.position_id,
        titleEn: pos.title_en,
        titleAr: pos.title_ar,
        governmentGrade: pos.government_grade,
        departmentName: pos.department_name,
        ministryName: pos.ministry_name,
        startDate: pos.start_date,
        endDate: pos.end_date,
        assignmentType: pos.assignment_type,
        isCurrent: pos.is_current
      })),
      createdAt: employee.created_at,
      updatedAt: employee.updated_at
    }

    res.json({
      success: true,
      data: employeeData
    })
  })
)

module.exports = router