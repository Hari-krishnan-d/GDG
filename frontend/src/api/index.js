import axios from 'axios';
import { getToken } from '../auth.js';

// ─── Axios client ────────────────────────────────────────────────────────────
// FORCE MOCK MODE: Pointing to an invalid URL so all requests fail instantly
// and trigger the mockData catch blocks below.
const api = axios.create({
  baseURL: 'http://force-mock-mode.local/api',
  timeout: 1000, // Short timeout for instant fallback
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ─── Mock / Fallback Data ─────────────────────────────────────────────────────
export const mockData = {
  dashboardSummary: {
    total_beds: 36,
    available_beds: 14,
    occupied_beds: 19,
    maintenance_beds: 3,
    total_medicines: 48,
    low_stock_count: 7,
    critical_stock_count: 3,
    doctors_present: 4,
    nurses_present: 8,
    total_staff: 18,
    today_patients: 94,
    last_updated: new Date().toISOString(),
  },

  footfallForecast: [
    { date: '2026-07-06', day_name: 'Monday',    predicted: 95,  lower: 82,  upper: 108 },
    { date: '2026-07-07', day_name: 'Tuesday',   predicted: 112, lower: 98,  upper: 126 },
    { date: '2026-07-08', day_name: 'Wednesday', predicted: 88,  lower: 74,  upper: 102 },
    { date: '2026-07-09', day_name: 'Thursday',  predicted: 103, lower: 89,  upper: 117 },
    { date: '2026-07-10', day_name: 'Friday',    predicted: 72,  lower: 58,  upper: 86  },
    { date: '2026-07-11', day_name: 'Saturday',  predicted: 55,  lower: 42,  upper: 68  },
    { date: '2026-07-12', day_name: 'Sunday',    predicted: 98,  lower: 84,  upper: 112 },
  ],

  medicines: [
    { id: 1,  name: 'Paracetamol 500mg',   category: 'Analgesic',    current_stock: 850,  max_capacity: 1000, unit: 'tablets',  expiry: '2027-03-01' },
    { id: 2,  name: 'Amoxicillin 250mg',   category: 'Antibiotic',   current_stock: 120,  max_capacity: 500,  unit: 'capsules', expiry: '2026-11-15' },
    { id: 3,  name: 'ORS Sachets',         category: 'Electrolyte',  current_stock: 45,   max_capacity: 200,  unit: 'sachets',  expiry: '2027-01-20' },
    { id: 4,  name: 'Metformin 500mg',     category: 'Anti-diabetic',current_stock: 300,  max_capacity: 600,  unit: 'tablets',  expiry: '2027-06-10' },
    { id: 5,  name: 'Atenolol 50mg',       category: 'Cardiac',      current_stock: 18,   max_capacity: 400,  unit: 'tablets',  expiry: '2026-09-30' },
    { id: 6,  name: 'Iron + Folic Acid',   category: 'Supplement',   current_stock: 410,  max_capacity: 800,  unit: 'tablets',  expiry: '2027-02-28' },
    { id: 7,  name: 'Chlorphenamine 4mg',  category: 'Antihistamine',current_stock: 60,   max_capacity: 300,  unit: 'tablets',  expiry: '2026-12-01' },
    { id: 8,  name: 'Ranitidine 150mg',    category: 'Antacid',      current_stock: 230,  max_capacity: 500,  unit: 'tablets',  expiry: '2027-04-15' },
    { id: 9,  name: 'Dexamethasone 0.5mg', category: 'Steroid',      current_stock: 12,   max_capacity: 200,  unit: 'tablets',  expiry: '2026-08-20' },
    { id: 10, name: 'Cotrimoxazole',       category: 'Antibiotic',   current_stock: 180,  max_capacity: 400,  unit: 'tablets',  expiry: '2027-05-01' },
    { id: 11, name: 'Vitamin B Complex',   category: 'Supplement',   current_stock: 520,  max_capacity: 700,  unit: 'tablets',  expiry: '2027-08-01' },
    { id: 12, name: 'Salbutamol Inhaler',  category: 'Bronchodilator',current_stock: 8,   max_capacity: 50,   unit: 'inhalers', expiry: '2026-10-31' },
  ],

  beds: [
    { id: 1,  bed_number: 'G-01', ward: 'General',   status: 'available',   patient_name: null,         admitted_at: null },
    { id: 2,  bed_number: 'G-02', ward: 'General',   status: 'occupied',    patient_name: 'Raju K.',    admitted_at: '2026-07-04T09:00:00Z' },
    { id: 3,  bed_number: 'G-03', ward: 'General',   status: 'occupied',    patient_name: 'Priya S.',   admitted_at: '2026-07-03T14:30:00Z' },
    { id: 4,  bed_number: 'G-04', ward: 'General',   status: 'maintenance', patient_name: null,         admitted_at: null },
    { id: 5,  bed_number: 'G-05', ward: 'General',   status: 'available',   patient_name: null,         admitted_at: null },
    { id: 6,  bed_number: 'G-06', ward: 'General',   status: 'occupied',    patient_name: 'Mohan L.',   admitted_at: '2026-07-05T07:15:00Z' },
    { id: 7,  bed_number: 'M-01', ward: 'Maternity', status: 'occupied',    patient_name: 'Sunita D.',  admitted_at: '2026-07-02T11:00:00Z' },
    { id: 8,  bed_number: 'M-02', ward: 'Maternity', status: 'available',   patient_name: null,         admitted_at: null },
    { id: 9,  bed_number: 'M-03', ward: 'Maternity', status: 'occupied',    patient_name: 'Kavitha R.', admitted_at: '2026-07-05T06:45:00Z' },
    { id: 10, bed_number: 'M-04', ward: 'Maternity', status: 'available',   patient_name: null,         admitted_at: null },
    { id: 11, bed_number: 'P-01', ward: 'Pediatric', status: 'occupied',    patient_name: 'Arjun (5y)',  admitted_at: '2026-07-04T16:00:00Z' },
    { id: 12, bed_number: 'P-02', ward: 'Pediatric', status: 'available',   patient_name: null,         admitted_at: null },
    { id: 13, bed_number: 'P-03', ward: 'Pediatric', status: 'occupied',    patient_name: 'Meera (3y)', admitted_at: '2026-07-05T08:00:00Z' },
    { id: 14, bed_number: 'P-04', ward: 'Pediatric', status: 'maintenance', patient_name: null,         admitted_at: null },
    { id: 15, bed_number: 'ICU-1', ward: 'ICU',      status: 'occupied',    patient_name: 'Balaji R.',  admitted_at: '2026-07-03T22:00:00Z' },
    { id: 16, bed_number: 'ICU-2', ward: 'ICU',      status: 'available',   patient_name: null,         admitted_at: null },
  ],

  staff: [
    { id: 1, name: 'Dr. Anitha Krishnan',   role: 'Medical Officer',  department: 'General OPD',   phone: '9876543210' },
    { id: 2, name: 'Dr. Ramesh Babu',       role: 'Medical Officer',  department: 'Pediatric',     phone: '9876543211' },
    { id: 3, name: 'Nurse Sudha Menon',     role: 'Staff Nurse',      department: 'Maternity',     phone: '9876543212' },
    { id: 4, name: 'Nurse Vijaya Kumar',    role: 'Staff Nurse',      department: 'General Ward',  phone: '9876543213' },
    { id: 5, name: 'Pharmacist Rajan P.',   role: 'Pharmacist',       department: 'Pharmacy',      phone: '9876543214' },
    { id: 6, name: 'Lab Tech Geetha S.',    role: 'Lab Technician',   department: 'Laboratory',    phone: '9876543215' },
  ],

  attendanceToday: [
    { id: 1, staff_id: 1, staff_name: 'Dr. Anitha Krishnan', role: 'Medical Officer', status: 'present', check_in_time: '2026-07-05T08:05:00Z', latitude: 12.9716, longitude: 77.5946 },
    { id: 2, staff_id: 2, staff_name: 'Dr. Ramesh Babu',     role: 'Medical Officer', status: 'present', check_in_time: '2026-07-05T08:22:00Z', latitude: 12.9718, longitude: 77.5948 },
    { id: 3, staff_id: 3, staff_name: 'Nurse Sudha Menon',   role: 'Staff Nurse',     status: 'present', check_in_time: '2026-07-05T07:58:00Z', latitude: 12.9715, longitude: 77.5944 },
    { id: 4, staff_id: 4, staff_name: 'Nurse Vijaya Kumar',  role: 'Staff Nurse',     status: 'present', check_in_time: '2026-07-05T08:10:00Z', latitude: 12.9717, longitude: 77.5947 },
    { id: 5, staff_id: 5, staff_name: 'Pharmacist Rajan P.', role: 'Pharmacist',      status: 'absent',  check_in_time: null, latitude: null, longitude: null },
    { id: 6, staff_id: 6, staff_name: 'Lab Tech Geetha S.',  role: 'Lab Technician',  status: 'absent',  check_in_time: null, latitude: null, longitude: null },
  ],

  stockoutAlerts: [
    { id: 1, medicine_id: 9,  medicine_name: 'Dexamethasone 0.5mg', current_stock: 12,  days_remaining: 3,  alert_level: 'critical', estimated_stockout_date: '2026-07-08' },
    { id: 2, medicine_id: 12, medicine_name: 'Salbutamol Inhaler',  current_stock: 8,   days_remaining: 5,  alert_level: 'critical', estimated_stockout_date: '2026-07-10' },
    { id: 3, medicine_id: 5,  medicine_name: 'Atenolol 50mg',       current_stock: 18,  days_remaining: 9,  alert_level: 'warning',  estimated_stockout_date: '2026-07-14' },
    { id: 4, medicine_id: 3,  medicine_name: 'ORS Sachets',         current_stock: 45,  days_remaining: 11, alert_level: 'warning',  estimated_stockout_date: '2026-07-16' },
    { id: 5, medicine_id: 7,  medicine_name: 'Chlorphenamine 4mg',  current_stock: 60,  days_remaining: 14, alert_level: 'warning',  estimated_stockout_date: '2026-07-19' },
  ],
};

// ─── API Functions with Mock Fallback ─────────────────────────────────────────

export const getDashboardSummary = async () => {
  try {
    const { data } = await api.get('/dashboard/summary');
    return data;
  } catch {
    return mockData.dashboardSummary;
  }
};

export const getMedicines = async () => {
  try {
    const { data } = await api.get('/medicines');
    return data;
  } catch {
    return mockData.medicines;
  }
};

export const consumeMedicine = async (id, amount) => {
  try {
    const { data } = await api.put(`/medicines/${id}/consume`, { amount });
    return data;
  } catch {
    return { success: true, message: 'Mock: consumed', mock: true };
  }
};

export const restockMedicine = async (id, amount) => {
  try {
    const { data } = await api.put(`/medicines/${id}/restock`, { amount });
    return data;
  } catch {
    return { success: true, message: 'Mock: restocked', mock: true };
  }
};

export const getBeds = async () => {
  try {
    const { data } = await api.get('/beds');
    return data;
  } catch {
    return mockData.beds;
  }
};

export const getBedSummary = async () => {
  try {
    const { data } = await api.get('/beds/summary');
    return data;
  } catch {
    const beds = mockData.beds;
    return {
      available:   beds.filter(b => b.status === 'available').length,
      occupied:    beds.filter(b => b.status === 'occupied').length,
      maintenance: beds.filter(b => b.status === 'maintenance').length,
      total:       beds.length,
    };
  }
};

export const updateBedStatus = async (id, status, patientName = null) => {
  try {
    const { data } = await api.put(`/beds/${id}/status`, { status, patient_name: patientName });
    return data;
  } catch {
    return { success: true, message: 'Mock: updated', mock: true };
  }
};

export const getStaff = async () => {
  try {
    const { data } = await api.get('/staff');
    return data;
  } catch {
    return mockData.staff;
  }
};

export const getAttendanceToday = async () => {
  try {
    const { data } = await api.get('/attendance/today');
    return data;
  } catch {
    return mockData.attendanceToday;
  }
};

export const checkIn = async (staffId, latitude, longitude) => {
  try {
    const { data } = await api.post('/attendance/checkin', { staff_id: staffId, latitude, longitude });
    return data;
  } catch {
    // Simulate geofence check with mock coords (Bangalore center ±0.01°)
    const refLat = 12.9716, refLng = 77.5946;
    const dist = Math.sqrt(Math.pow(latitude - refLat, 2) + Math.pow(longitude - refLng, 2));
    if (dist < 0.005) {
      return { success: true, within_geofence: true, message: 'Marked Present - You are within the geofence', mock: true };
    } else {
      return { success: false, within_geofence: false, message: 'Outside geofence radius', mock: true };
    }
  }
};

export const getFootfallForecast = async () => {
  try {
    const { data } = await api.get('/forecast/footfall');
    return data;
  } catch {
    return mockData.footfallForecast;
  }
};

export const getStockoutAlerts = async () => {
  try {
    const { data } = await api.get('/forecast/stockout');
    return data;
  } catch {
    return mockData.stockoutAlerts;
  }
};

export const refreshForecast = async () => {
  try {
    const { data } = await api.post('/forecast/refresh');
    return data;
  } catch {
    return { success: true, message: 'Mock: Forecast refreshed (offline mode)', mock: true, refreshed_at: new Date().toISOString() };
  }
};

export const checkApiHealth = async () => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};

export default api;
