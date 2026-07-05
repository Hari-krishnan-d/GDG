-- Facilities (PHC/CHC locations)
CREATE TABLE IF NOT EXISTS facilities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('PHC', 'CHC')) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicine Inventory
CREATE TABLE IF NOT EXISTS medicine_inventory (
  id SERIAL PRIMARY KEY,
  facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'tablets',
  current_stock INT NOT NULL DEFAULT 0,
  reorder_threshold INT NOT NULL DEFAULT 100,
  max_capacity INT NOT NULL DEFAULT 1000,
  avg_daily_consumption DECIMAL(10,2) DEFAULT 0,
  last_restocked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Beds
CREATE TABLE IF NOT EXISTS beds (
  id SERIAL PRIMARY KEY,
  facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
  bed_number VARCHAR(20) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
  patient_name VARCHAR(200),
  admitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(100) NOT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
  id SERIAL PRIMARY KEY,
  staff_id INT REFERENCES staff(id) ON DELETE CASCADE,
  facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
  geofence_valid BOOLEAN DEFAULT FALSE,
  date DATE DEFAULT CURRENT_DATE
);

-- Patient Visits
CREATE TABLE IF NOT EXISTS patient_visits (
  id SERIAL PRIMARY KEY,
  facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  patient_count INT NOT NULL DEFAULT 0,
  opd_count INT DEFAULT 0,
  emergency_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Footfall Forecast (AI output)
CREATE TABLE IF NOT EXISTS footfall_forecast (
  id SERIAL PRIMARY KEY,
  facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_footfall INT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(facility_id, forecast_date)
);

-- Stockout Alerts (AI output)
CREATE TABLE IF NOT EXISTS stockout_alerts (
  id SERIAL PRIMARY KEY,
  medicine_id INT REFERENCES medicine_inventory(id) ON DELETE CASCADE,
  facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
  days_remaining DECIMAL(10,2),
  alert_level VARCHAR(20) CHECK (alert_level IN ('warning', 'critical', 'ok')) DEFAULT 'ok',
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(medicine_id)
);

-- Medicine Consumption Log
CREATE TABLE IF NOT EXISTS medicine_consumption_log (
  id SERIAL PRIMARY KEY,
  medicine_id INT REFERENCES medicine_inventory(id) ON DELETE CASCADE,
  facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
  consumed_amount INT NOT NULL,
  consumed_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
