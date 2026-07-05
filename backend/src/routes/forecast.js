const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { refreshFootfallForecast, refreshStockoutAlerts } = require('../services/cronService');

// GET /footfall — next 7 days forecast
router.get('/footfall', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ff.*,
        f.name AS facility_name
      FROM footfall_forecast ff
      JOIN facilities f ON f.id = ff.facility_id
      WHERE ff.forecast_date >= CURRENT_DATE
      ORDER BY ff.forecast_date ASC
      LIMIT 7
    `);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[Forecast] GET /footfall error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /stockout — active stockout alerts (warning or critical only)
router.get('/stockout', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sa.*,
        mi.name              AS medicine_name,
        mi.category,
        mi.unit,
        mi.current_stock,
        mi.avg_daily_consumption,
        mi.reorder_threshold,
        f.name               AS facility_name
      FROM stockout_alerts sa
      JOIN medicine_inventory mi ON mi.id = sa.medicine_id
      JOIN facilities f ON f.id = sa.facility_id
      WHERE sa.alert_level IN ('warning', 'critical')
      ORDER BY sa.days_remaining ASC
    `);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[Forecast] GET /stockout error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /refresh — manually trigger AI forecast refresh
router.post('/refresh', async (req, res) => {
  try {
    console.log('[Forecast] Manual refresh triggered via API');
    // Run both refreshes concurrently
    const [footfallResult, stockoutResult] = await Promise.allSettled([
      refreshFootfallForecast(),
      refreshStockoutAlerts(),
    ]);

    const summary = {
      footfall: footfallResult.status === 'fulfilled' ? 'refreshed' : `error: ${footfallResult.reason}`,
      stockout: stockoutResult.status === 'fulfilled' ? 'refreshed' : `error: ${stockoutResult.reason}`,
    };

    res.json({
      status: 'success',
      message: 'Forecast refresh completed',
      summary,
    });
  } catch (err) {
    console.error('[Forecast] POST /refresh error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
