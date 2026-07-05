const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { isWithinGeofence } = require('../services/geofenceService');

// POST /checkin — check in a staff member with geofence validation
router.post('/checkin', async (req, res) => {
  try {
    const { staff_id, latitude, longitude } = req.body;

    if (!staff_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'staff_id, latitude, and longitude are required'
      });
    }

    // Validate staff exists
    const staffResult = await pool.query(
      'SELECT id, facility_id, name FROM staff WHERE id = $1 AND is_active = TRUE',
      [staff_id]
    );
    if (staffResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Active staff member not found' });
    }
    const staffMember = staffResult.rows[0];

    // Check if already checked in today
    const existingLog = await pool.query(
      'SELECT id FROM attendance_logs WHERE staff_id = $1 AND date = CURRENT_DATE',
      [staff_id]
    );
    if (existingLog.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Staff member has already checked in today'
      });
    }

    // Geofence validation
    const geo = isWithinGeofence(parseFloat(latitude), parseFloat(longitude));

    // Determine attendance status
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    // Late if after 09:30 AM (570 minutes from midnight)
    let status = 'absent';
    if (geo.isInside) {
      status = totalMinutes > 570 ? 'late' : 'present';
    }

    // Insert attendance log
    const result = await pool.query(`
      INSERT INTO attendance_logs
        (staff_id, facility_id, check_in_time, latitude, longitude, status, geofence_valid, date)
      VALUES ($1, $2, NOW(), $3, $4, $5, $6, CURRENT_DATE)
      RETURNING *
    `, [staff_id, staffMember.facility_id, latitude, longitude, status, geo.isInside]);

    res.status(201).json({
      status: 'success',
      data: result.rows[0],
      geofence: geo,
      attendance_status: status,
    });
  } catch (err) {
    console.error('[Attendance] POST /checkin error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /today — all attendance logs for today with staff name
router.get('/today', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        al.*,
        s.name     AS staff_name,
        s.role     AS staff_role,
        s.employee_id
      FROM attendance_logs al
      JOIN staff s ON s.id = al.staff_id
      WHERE al.date = CURRENT_DATE
      ORDER BY al.check_in_time ASC
    `);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[Attendance] GET /today error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /staff/:staff_id — attendance history for a specific staff member
router.get('/staff/:staff_id', async (req, res) => {
  try {
    const { staff_id } = req.params;
    const result = await pool.query(`
      SELECT
        al.*,
        s.name       AS staff_name,
        s.role       AS staff_role,
        s.employee_id
      FROM attendance_logs al
      JOIN staff s ON s.id = al.staff_id
      WHERE al.staff_id = $1
      ORDER BY al.date DESC, al.check_in_time DESC
      LIMIT 90
    `, [staff_id]);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[Attendance] GET /staff/:staff_id error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
