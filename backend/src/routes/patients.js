const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET / — patient visit logs for last 30 days
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM patient_visits
      WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY visit_date DESC
    `);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[Patients] GET / error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /today — today's visit count
router.get('/today', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM patient_visits
      WHERE visit_date = CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const data = result.rows[0] || {
      visit_date: new Date().toISOString().split('T')[0],
      patient_count: 0,
      opd_count: 0,
      emergency_count: 0
    };
    res.json({ status: 'success', data });
  } catch (err) {
    console.error('[Patients] GET /today error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /log — log patient visit data
router.post('/log', async (req, res) => {
  try {
    const { facility_id, visit_date, patient_count, opd_count, emergency_count } = req.body;

    if (!facility_id || !visit_date || patient_count === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'facility_id, visit_date, and patient_count are required'
      });
    }

    const result = await pool.query(`
      INSERT INTO patient_visits (facility_id, visit_date, patient_count, opd_count, emergency_count)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      facility_id,
      visit_date,
      patient_count,
      opd_count || 0,
      emergency_count || 0
    ]);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Patients] POST /log error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
