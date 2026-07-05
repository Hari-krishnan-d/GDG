-- ============================================================
-- Smart Health PHC/CHC Seed Data
-- Reference date: 2026-07-05
-- ============================================================

-- -------------------------
-- Facilities
-- -------------------------
INSERT INTO facilities (id, name, type, address, latitude, longitude)
VALUES (
  1,
  'City Community Health Centre',
  'CHC',
  'Connaught Place, New Delhi, Delhi 110001',
  28.6139,
  77.2090
) ON CONFLICT (id) DO NOTHING;

-- Reset sequence after explicit id insert
SELECT setval('facilities_id_seq', (SELECT MAX(id) FROM facilities));

-- -------------------------
-- Medicine Inventory (12 medicines)
-- -------------------------
INSERT INTO medicine_inventory (facility_id, name, category, unit, current_stock, reorder_threshold, max_capacity, avg_daily_consumption, last_restocked_at) VALUES
  (1, 'Paracetamol 500mg',    'Analgesic',        'tablets', 45,   100, 2000, 28.5, NOW() - INTERVAL '15 days'),  -- CRITICAL
  (1, 'Amoxicillin 500mg',    'Antibiotic',       'capsules', 320,  150, 1500, 18.2, NOW() - INTERVAL '5 days'),   -- OK
  (1, 'ORS Sachets',          'Rehydration',      'sachets',  60,   200, 3000, 35.0, NOW() - INTERVAL '20 days'),  -- CRITICAL
  (1, 'Metformin 500mg',      'Antidiabetic',     'tablets', 210,  100, 1000, 12.4, NOW() - INTERVAL '8 days'),    -- OK
  (1, 'Atenolol 50mg',        'Antihypertensive', 'tablets', 88,   100, 1000, 8.6,  NOW() - INTERVAL '12 days'),   -- WARNING
  (1, 'Iron Tablets 150mg',   'Nutritional',      'tablets', 500,  200, 2000, 22.1, NOW() - INTERVAL '3 days'),    -- OK
  (1, 'Vitamin D3 60000 IU',  'Nutritional',      'capsules', 145, 100, 500,  4.8,  NOW() - INTERVAL '10 days'),   -- OK
  (1, 'Cotrimoxazole 480mg',  'Antibiotic',       'tablets', 270,  150, 1500, 14.0, NOW() - INTERVAL '6 days'),    -- OK
  (1, 'Omeprazole 20mg',      'Antacid',          'capsules', 190, 100, 1000, 11.2, NOW() - INTERVAL '7 days'),    -- OK
  (1, 'Ibuprofen 400mg',      'NSAID',            'tablets', 42,   100, 1500, 16.8, NOW() - INTERVAL '18 days'),   -- CRITICAL
  (1, 'Azithromycin 500mg',   'Antibiotic',       'tablets', 130,  100, 800,  7.3,  NOW() - INTERVAL '4 days'),    -- OK
  (1, 'Chloroquine 250mg',    'Antimalarial',     'tablets', 95,   100, 1000, 5.5,  NOW() - INTERVAL '9 days')     -- WARNING
ON CONFLICT DO NOTHING;

-- -------------------------
-- Beds (12 beds across 3 wards)
-- -------------------------
INSERT INTO beds (facility_id, bed_number, ward, status, patient_name, admitted_at) VALUES
  -- General Ward (4 beds)
  (1, 'G-01', 'General',    'occupied',    'Ramesh Kumar',   NOW() - INTERVAL '2 days'),
  (1, 'G-02', 'General',    'occupied',    'Sunita Devi',    NOW() - INTERVAL '1 day'),
  (1, 'G-03', 'General',    'available',   NULL,             NULL),
  (1, 'G-04', 'General',    'maintenance', NULL,             NULL),
  -- Maternity Ward (4 beds)
  (1, 'M-01', 'Maternity',  'occupied',    'Priya Sharma',   NOW() - INTERVAL '3 days'),
  (1, 'M-02', 'Maternity',  'available',   NULL,             NULL),
  (1, 'M-03', 'Maternity',  'available',   NULL,             NULL),
  (1, 'M-04', 'Maternity',  'occupied',    'Anita Singh',    NOW() - INTERVAL '1 day'),
  -- Pediatric Ward (4 beds)
  (1, 'P-01', 'Pediatric',  'occupied',    'Arjun (7 yrs)',  NOW() - INTERVAL '1 day'),
  (1, 'P-02', 'Pediatric',  'available',   NULL,             NULL),
  (1, 'P-03', 'Pediatric',  'available',   NULL,             NULL),
  (1, 'P-04', 'Pediatric',  'maintenance', NULL,             NULL)
ON CONFLICT DO NOTHING;

-- -------------------------
-- Staff (6 members)
-- -------------------------
INSERT INTO staff (id, facility_id, name, role, employee_id, phone, email, is_active) VALUES
  (1, 1, 'Dr. Anil Mehta',      'Doctor',     'EMP-001', '9876543210', 'anil.mehta@chc.gov.in',    TRUE),
  (2, 1, 'Dr. Kavita Rao',      'Doctor',     'EMP-002', '9876543211', 'kavita.rao@chc.gov.in',     TRUE),
  (3, 1, 'Nurse Pooja Verma',   'Nurse',      'EMP-003', '9876543212', 'pooja.verma@chc.gov.in',    TRUE),
  (4, 1, 'Nurse Rajesh Gupta',  'Nurse',      'EMP-004', '9876543213', 'rajesh.gupta@chc.gov.in',   TRUE),
  (5, 1, 'Suresh Patel',        'Pharmacist', 'EMP-005', '9876543214', 'suresh.patel@chc.gov.in',   TRUE),
  (6, 1, 'Meena Joshi',         'Admin',      'EMP-006', '9876543215', 'meena.joshi@chc.gov.in',    TRUE)
ON CONFLICT (employee_id) DO NOTHING;

SELECT setval('staff_id_seq', (SELECT MAX(id) FROM staff));

-- -------------------------
-- Patient Visits (last 30 days with realistic data)
-- Monday/Tuesday = higher footfall, weekends = lower
-- -------------------------
INSERT INTO patient_visits (facility_id, visit_date, patient_count, opd_count, emergency_count) VALUES
  (1, CURRENT_DATE - 30, 95,  82, 13),
  (1, CURRENT_DATE - 29, 112, 96, 16),  -- Monday
  (1, CURRENT_DATE - 28, 125, 108, 17), -- Tuesday
  (1, CURRENT_DATE - 27, 108, 93, 15),
  (1, CURRENT_DATE - 26, 101, 88, 13),
  (1, CURRENT_DATE - 25, 72,  61, 11),  -- Saturday
  (1, CURRENT_DATE - 24, 58,  49, 9),   -- Sunday
  (1, CURRENT_DATE - 23, 118, 102, 16), -- Monday
  (1, CURRENT_DATE - 22, 130, 112, 18), -- Tuesday
  (1, CURRENT_DATE - 21, 110, 95, 15),
  (1, CURRENT_DATE - 20, 103, 90, 13),
  (1, CURRENT_DATE - 19, 97,  84, 13),
  (1, CURRENT_DATE - 18, 68,  58, 10),  -- Saturday
  (1, CURRENT_DATE - 17, 55,  47, 8),   -- Sunday
  (1, CURRENT_DATE - 16, 122, 105, 17), -- Monday
  (1, CURRENT_DATE - 15, 135, 117, 18), -- Tuesday
  (1, CURRENT_DATE - 14, 115, 100, 15),
  (1, CURRENT_DATE - 13, 107, 93, 14),
  (1, CURRENT_DATE - 12, 99,  86, 13),
  (1, CURRENT_DATE - 11, 74,  63, 11),  -- Saturday
  (1, CURRENT_DATE - 10, 61,  52, 9),   -- Sunday
  (1, CURRENT_DATE - 9,  119, 103, 16), -- Monday
  (1, CURRENT_DATE - 8,  128, 110, 18), -- Tuesday
  (1, CURRENT_DATE - 7,  111, 96, 15),
  (1, CURRENT_DATE - 6,  104, 91, 13),
  (1, CURRENT_DATE - 5,  98,  85, 13),
  (1, CURRENT_DATE - 4,  70,  60, 10),  -- Saturday
  (1, CURRENT_DATE - 3,  57,  49, 8),   -- Sunday
  (1, CURRENT_DATE - 2,  120, 104, 16), -- Monday
  (1, CURRENT_DATE - 1,  132, 114, 18)  -- Tuesday
ON CONFLICT DO NOTHING;

-- -------------------------
-- Footfall Forecast (next 7 days from 2026-07-05)
-- -------------------------
INSERT INTO footfall_forecast (facility_id, forecast_date, predicted_footfall) VALUES
  (1, '2026-07-05', 118),
  (1, '2026-07-06', 95),
  (1, '2026-07-07', 80),  -- Sunday
  (1, '2026-07-08', 125), -- Monday
  (1, '2026-07-09', 130), -- Tuesday
  (1, '2026-07-10', 112),
  (1, '2026-07-11', 106)
ON CONFLICT (facility_id, forecast_date) DO UPDATE SET predicted_footfall = EXCLUDED.predicted_footfall;

-- -------------------------
-- Stockout Alerts (3 critical medicines)
-- Paracetamol id=1 (45 stock, 28.5/day = ~1.6 days)
-- ORS id=3         (60 stock, 35.0/day = ~1.7 days)
-- Ibuprofen id=10  (42 stock, 16.8/day = ~2.5 days)
-- Atenolol id=5    (88 stock, 8.6/day  = ~10.2 days WARNING)
-- Chloroquine id=12(95 stock, 5.5/day  = ~17.3 days WARNING)
-- -------------------------
INSERT INTO stockout_alerts (medicine_id, facility_id, days_remaining, alert_level) VALUES
  (1,  1, 1.58,  'critical'),
  (3,  1, 1.71,  'critical'),
  (10, 1, 2.50,  'critical'),
  (5,  1, 10.23, 'warning'),
  (12, 1, 17.27, 'warning')
ON CONFLICT (medicine_id) DO UPDATE
  SET days_remaining = EXCLUDED.days_remaining,
      alert_level    = EXCLUDED.alert_level,
      triggered_at   = NOW();

-- -------------------------
-- Attendance Logs for today (4 of 6 staff present)
-- Staff 1,2,3,5 = present (geofence valid)
-- Staff 4 = late (inside geofence)
-- Staff 6 = absent
-- -------------------------
INSERT INTO attendance_logs (staff_id, facility_id, check_in_time, latitude, longitude, status, geofence_valid, date) VALUES
  (1, 1, CURRENT_DATE + TIME '08:55:00', 28.6140, 77.2091, 'present', TRUE,  CURRENT_DATE),
  (2, 1, CURRENT_DATE + TIME '09:02:00', 28.6138, 77.2089, 'present', TRUE,  CURRENT_DATE),
  (3, 1, CURRENT_DATE + TIME '08:48:00', 28.6141, 77.2092, 'present', TRUE,  CURRENT_DATE),
  (4, 1, CURRENT_DATE + TIME '09:35:00', 28.6137, 77.2088, 'late',    TRUE,  CURRENT_DATE),
  (5, 1, CURRENT_DATE + TIME '09:00:00', 28.6139, 77.2090, 'present', TRUE,  CURRENT_DATE)
ON CONFLICT DO NOTHING;
-- Staff 6 (Meena Joshi) is absent — no log entry for today
