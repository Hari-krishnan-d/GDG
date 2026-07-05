const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET / — all staff
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM staff ORDER BY role ASC, name ASC
    `);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[Staff] GET / error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /today-summary — count present/absent/late today
router.get('/today-summary', async (req, res) => {
  try {
    const totalResult = await pool.query(`SELECT COUNT(*) AS total FROM staff WHERE is_active = TRUE`);
    const attendanceResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE al.status = 'present') AS present,
        COUNT(*) FILTER (WHERE al.status = 'absent')  AS absent,
        COUNT(*) FILTER (WHERE al.status = 'late')    AS late
      FROM staff s
      LEFT JOIN attendance_logs al ON al.staff_id = s.id AND al.date = CURRENT_DATE
      WHERE s.is_active = TRUE
    `);

    const total = parseInt(totalResult.rows[0].total);
    const { present, absent, late } = attendanceResult.rows[0];
    const presentCount = parseInt(present || 0);
    const absentCount = parseInt(absent || 0);
    const lateCount = parseInt(late || 0);
    // Staff with no attendance log today are considered absent
    const noLogCount = total - (presentCount + absentCount + lateCount);

    res.json({
      status: 'success',
      data: {
        total,
        present: presentCount,
        late: lateCount,
        absent: absentCount + noLogCount,
      }
    });
  } catch (err) {
    console.error('[Staff] GET /today-summary error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST / — create staff member
router.post('/', async (req, res) => {
  try {
    const { facility_id, name, role, employee_id, phone, email } = req.body;
    if (!facility_id || !name || !role || !employee_id) {
      return res.status(400).json({
        status: 'error',
        message: 'facility_id, name, role, and employee_id are required'
      });
    }
    const result = await pool.query(`
      INSERT INTO staff (facility_id, name, role, employee_id, phone, email)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [facility_id, name, role, employee_id, phone || null, email || null]);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Staff] POST / error:', err.message);
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ status: 'error', message: 'employee_id already exists' });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT /:id — update staff details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, is_active } = req.body;

    const result = await pool.query(`
      UPDATE staff SET
        name      = COALESCE($1, name),
        role      = COALESCE($2, role),
        phone     = COALESCE($3, phone),
        email     = COALESCE($4, email),
        is_active = COALESCE($5, is_active)
      WHERE id = $6
      RETURNING *
    `, [name, role, phone, email, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Staff member not found' });
    }
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Staff] PUT /:id error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
