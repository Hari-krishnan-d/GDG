const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET / — all beds with optional ?ward= filter
router.get('/', async (req, res) => {
  try {
    const { ward } = req.query;
    let query = 'SELECT * FROM beds';
    const params = [];
    if (ward) {
      query += ' WHERE LOWER(ward) = LOWER($1)';
      params.push(ward);
    }
    query += ' ORDER BY ward ASC, bed_number ASC';
    const result = await pool.query(query, params);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[Beds] GET / error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /summary — aggregate counts
router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE status = 'available')     AS available,
        COUNT(*) FILTER (WHERE status = 'occupied')      AS occupied,
        COUNT(*) FILTER (WHERE status = 'maintenance')   AS maintenance
      FROM beds
    `);
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Beds] GET /summary error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST / — create bed
router.post('/', async (req, res) => {
  try {
    const { facility_id, bed_number, ward, status } = req.body;
    if (!facility_id || !bed_number || !ward) {
      return res.status(400).json({ status: 'error', message: 'facility_id, bed_number and ward are required' });
    }
    const validStatuses = ['available', 'occupied', 'maintenance'];
    const bedStatus = validStatuses.includes(status) ? status : 'available';

    const result = await pool.query(`
      INSERT INTO beds (facility_id, bed_number, ward, status, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [facility_id, bed_number, ward, bedStatus]);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Beds] POST / error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT /:id/status — update bed status and optionally patient_name
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, patient_name } = req.body;

    const validStatuses = ['available', 'occupied', 'maintenance'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Clear patient info when bed is freed
    const pName = status === 'occupied' ? (patient_name || null) : null;
    const admittedAt = status === 'occupied' ? 'NOW()' : 'NULL';

    const result = await pool.query(`
      UPDATE beds SET
        status       = $1,
        patient_name = $2,
        admitted_at  = ${admittedAt},
        updated_at   = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, pName, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Bed not found' });
    }
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Beds] PUT /:id/status error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
