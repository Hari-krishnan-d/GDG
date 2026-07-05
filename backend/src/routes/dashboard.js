const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { checkAIHealth } = require('../services/aiClient');

// GET /summary — single aggregated dashboard payload
router.get('/summary', async (req, res) => {
  try {
    // Run all DB queries concurrently for performance
    const [
      bedsResult,
      medicinesResult,
      staffResult,
      patientsResult,
      alertsResult,
    ] = await Promise.all([
      // Beds summary
      pool.query(`
        SELECT
          COUNT(*)                                        AS total,
          COUNT(*) FILTER (WHERE status = 'available')   AS available,
          COUNT(*) FILTER (WHERE status = 'occupied')    AS occupied,
          COUNT(*) FILTER (WHERE status = 'maintenance') AS maintenance
        FROM beds
      `),
      // Medicines summary
      pool.query(`
        SELECT
          COUNT(*)                                                     AS total,
          COUNT(*) FILTER (WHERE sa.alert_level = 'warning')          AS low_stock,
          COUNT(*) FILTER (WHERE sa.alert_level = 'critical')         AS critical
        FROM medicine_inventory mi
        LEFT JOIN stockout_alerts sa ON sa.medicine_id = mi.id
      `),
      // Staff summary (total active + today present)
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM staff WHERE is_active = TRUE)                              AS total,
          COUNT(*) FILTER (WHERE al.status IN ('present', 'late') AND al.date = CURRENT_DATE) AS present_today
        FROM staff s
        LEFT JOIN attendance_logs al ON al.staff_id = s.id AND al.date = CURRENT_DATE
        WHERE s.is_active = TRUE
      `),
      // Patient stats (today + this week)
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN visit_date = CURRENT_DATE THEN patient_count ELSE 0 END), 0) AS today_count,
          COALESCE(SUM(CASE WHEN visit_date >= CURRENT_DATE - INTERVAL '6 days' THEN patient_count ELSE 0 END), 0) AS week_total
        FROM patient_visits
        WHERE visit_date >= CURRENT_DATE - INTERVAL '6 days'
      `),
      // Active alerts (critical + warning stockout)
      pool.query(`
        SELECT
          sa.alert_level,
          sa.days_remaining,
          sa.triggered_at,
          mi.name  AS medicine_name,
          mi.current_stock,
          f.name   AS facility_name
        FROM stockout_alerts sa
        JOIN medicine_inventory mi ON mi.id = sa.medicine_id
        JOIN facilities f ON f.id = sa.facility_id
        WHERE sa.alert_level IN ('critical', 'warning')
        ORDER BY sa.days_remaining ASC
        LIMIT 10
      `),
    ]);

    // Check AI engine health (non-blocking — use cached timeout)
    const aiHealthPromise = checkAIHealth();
    const aiHealth = await Promise.race([
      aiHealthPromise,
      new Promise(resolve => setTimeout(() => resolve({ status: 'offline' }), 4000))
    ]);

    const beds = bedsResult.rows[0];
    const medicines = medicinesResult.rows[0];
    const staff = staffResult.rows[0];
    const patients = patientsResult.rows[0];

    res.json({
      status: 'success',
      data: {
        beds: {
          total:       parseInt(beds.total),
          available:   parseInt(beds.available),
          occupied:    parseInt(beds.occupied),
          maintenance: parseInt(beds.maintenance),
        },
        medicines: {
          total:     parseInt(medicines.total),
          lowStock:  parseInt(medicines.low_stock || 0),
          critical:  parseInt(medicines.critical || 0),
        },
        staff: {
          total:        parseInt(staff.total),
          presentToday: parseInt(staff.present_today || 0),
        },
        patients: {
          todayCount: parseInt(patients.today_count || 0),
          weekTotal:  parseInt(patients.week_total || 0),
        },
        alerts: alertsResult.rows,
        aiStatus: aiHealth.status === 'ok' || aiHealth.status === 'healthy' ? 'online' : 'offline',
      }
    });
  } catch (err) {
    console.error('[Dashboard] GET /summary error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
