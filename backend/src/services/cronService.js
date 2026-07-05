const cron = require('node-cron');
const pool = require('../db/pool');
const { fetchFootfallForecast, fetchStockoutForecast } = require('./aiClient');

function startCronJobs() {
  // Run at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running nightly AI forecast refresh...');
    await refreshFootfallForecast();
    await refreshStockoutAlerts();
    console.log('[Cron] Nightly forecast refresh complete.');
  });
  console.log('[Cron] Scheduled nightly forecast job at midnight.');
}

async function refreshFootfallForecast() {
  try {
    const facilitiesResult = await pool.query('SELECT id FROM facilities');
    for (const facility of facilitiesResult.rows) {
      const forecast = await fetchFootfallForecast(facility.id);
      if (forecast && forecast.status === 'success') {
        for (const item of forecast.forecast) {
          await pool.query(
            `INSERT INTO footfall_forecast (facility_id, forecast_date, predicted_footfall)
             VALUES ($1, $2, $3)
             ON CONFLICT (facility_id, forecast_date) DO UPDATE SET predicted_footfall = $3, generated_at = NOW()`,
            [facility.id, item.date, item.predicted_footfall]
          );
        }
        console.log(`[Cron] Footfall forecast saved for facility ${facility.id}`);
      }
    }
  } catch (err) {
    console.error('[Cron] Footfall refresh error:', err.message);
  }
}

async function refreshStockoutAlerts() {
  try {
    const medicines = await pool.query(
      `SELECT id, name, current_stock, avg_daily_consumption, facility_id
       FROM medicine_inventory WHERE avg_daily_consumption > 0`
    );
    const payload = medicines.rows.map(m => ({
      id: m.id,
      name: m.name,
      current_stock: m.current_stock,
      avg_daily_consumption: m.avg_daily_consumption,
    }));
    const forecast = await fetchStockoutForecast(payload);
    if (forecast && forecast.status === 'success') {
      for (const alert of forecast.alerts) {
        const level = alert.days_remaining <= 3 ? 'critical' : alert.days_remaining <= 7 ? 'warning' : 'ok';
        await pool.query(
          `INSERT INTO stockout_alerts (medicine_id, facility_id, days_remaining, alert_level)
           VALUES ($1, (SELECT facility_id FROM medicine_inventory WHERE id=$1), $2, $3)
           ON CONFLICT (medicine_id) DO UPDATE SET days_remaining=$2, alert_level=$3, triggered_at=NOW()`,
          [alert.id, alert.days_remaining, level]
        );
      }
    }
  } catch (err) {
    console.error('[Cron] Stockout refresh error:', err.message);
  }
}

module.exports = { startCronJobs, refreshFootfallForecast, refreshStockoutAlerts };
