const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET / — list all medicines with stockout alert join
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.*,
        sa.days_remaining,
        sa.alert_level,
        sa.triggered_at
      FROM medicine_inventory m
      LEFT JOIN stockout_alerts sa ON sa.medicine_id = m.id
      ORDER BY m.name ASC
    `);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[Medicines] GET / error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /:id — single medicine with stockout alert
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        m.*,
        sa.days_remaining,
        sa.alert_level,
        sa.triggered_at
      FROM medicine_inventory m
      LEFT JOIN stockout_alerts sa ON sa.medicine_id = m.id
      WHERE m.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Medicine not found' });
    }
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Medicines] GET /:id error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST / — create medicine
router.post('/', async (req, res) => {
  try {
    const {
      facility_id, name, category, unit,
      current_stock, reorder_threshold, max_capacity, avg_daily_consumption
    } = req.body;

    if (!facility_id || !name) {
      return res.status(400).json({ status: 'error', message: 'facility_id and name are required' });
    }

    const result = await pool.query(`
      INSERT INTO medicine_inventory
        (facility_id, name, category, unit, current_stock, reorder_threshold, max_capacity, avg_daily_consumption, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [
      facility_id, name, category || null, unit || 'tablets',
      current_stock || 0, reorder_threshold || 100, max_capacity || 1000,
      avg_daily_consumption || 0
    ]);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Medicines] POST / error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT /:id — update medicine fields
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, category, unit, current_stock,
      reorder_threshold, max_capacity, avg_daily_consumption
    } = req.body;

    const result = await pool.query(`
      UPDATE medicine_inventory SET
        name                 = COALESCE($1, name),
        category             = COALESCE($2, category),
        unit                 = COALESCE($3, unit),
        current_stock        = COALESCE($4, current_stock),
        reorder_threshold    = COALESCE($5, reorder_threshold),
        max_capacity         = COALESCE($6, max_capacity),
        avg_daily_consumption = COALESCE($7, avg_daily_consumption),
        updated_at           = NOW()
      WHERE id = $8
      RETURNING *
    `, [name, category, unit, current_stock, reorder_threshold, max_capacity, avg_daily_consumption, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Medicine not found' });
    }
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Medicines] PUT /:id error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT /:id/consume — decrement stock, update avg_daily_consumption, log consumption
router.put('/:id/consume', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ status: 'error', message: 'amount must be a positive integer' });
    }

    await client.query('BEGIN');

    // Fetch current medicine
    const medResult = await client.query(
      'SELECT * FROM medicine_inventory WHERE id = $1 FOR UPDATE', [id]
    );
    if (medResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Medicine not found' });
    }

    const med = medResult.rows[0];
    const newStock = Math.max(0, med.current_stock - amount);

    // Recalculate avg_daily_consumption as rolling weighted average (last 30 days)
    const logResult = await client.query(`
      SELECT COALESCE(SUM(consumed_amount), 0) AS total_consumed, COUNT(*) AS days
      FROM medicine_consumption_log
      WHERE medicine_id = $1 AND consumed_date >= CURRENT_DATE - INTERVAL '29 days'
    `, [id]);
    const totalConsumed = parseFloat(logResult.rows[0].total_consumed) + amount;
    const days = Math.min(parseInt(logResult.rows[0].days) + 1, 30);
    const newAvg = (totalConsumed / days).toFixed(2);

    // Update stock and avg
    const updated = await client.query(`
      UPDATE medicine_inventory
      SET current_stock = $1, avg_daily_consumption = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [newStock, newAvg, id]);

    // Log the consumption
    await client.query(`
      INSERT INTO medicine_consumption_log (medicine_id, facility_id, consumed_amount, consumed_date)
      VALUES ($1, $2, $3, CURRENT_DATE)
    `, [id, med.facility_id, amount]);

    await client.query('COMMIT');
    res.json({ status: 'success', data: updated.rows[0], logged_amount: amount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Medicines] PUT /:id/consume error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    client.release();
  }
});

// PUT /:id/restock — add stock
router.put('/:id/restock', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ status: 'error', message: 'amount must be a positive integer' });
    }

    const result = await pool.query(`
      UPDATE medicine_inventory
      SET
        current_stock      = LEAST(current_stock + $1, max_capacity),
        last_restocked_at  = NOW(),
        updated_at         = NOW()
      WHERE id = $2
      RETURNING *
    `, [amount, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Medicine not found' });
    }
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[Medicines] PUT /:id/restock error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM medicine_inventory WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Medicine not found' });
    }
    res.json({ status: 'success', message: `Medicine ${id} deleted` });
  } catch (err) {
    console.error('[Medicines] DELETE /:id error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
