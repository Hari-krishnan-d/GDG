# 🏥 Prototype SmartHealth — PHC/CHC Real-Time AI Management System

A full-stack, AI-driven management dashboard for Primary Health Centres (PHCs) and Community Health Centres (CHCs). Features real-time medicine stock tracking, bed availability, geofenced doctor attendance, and XGBoost-powered 7-day forecasting for patient footfall and medicine stockouts.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💊 **Medicine Inventory** | Real-time stock tracking with progress bars, consume/restock actions |
| 🛏️ **Bed Availability** | Visual bed grid across wards (General, Maternity, Pediatric) |
| 👨‍⚕️ **Staff & Attendance** | Geofenced check-in using HTML5 Geolocation API (200m radius) |
| 🤖 **AI Footfall Forecast** | XGBoost model predicts next 7 days of patient footfall |
| ⚠️ **Stockout Alerts** | Automatic alerts 7 days before medicine runs out |
| 🔄 **Nightly Cron** | Auto-refreshes AI predictions at midnight via node-cron |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│         React + Vite Dashboard (port 3000)      │
│    Dark Glassmorphism UI · 5 Pages · Recharts   │
└────────────────────┬────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────┐
│      Node.js + Express Backend (port 5000)      │
│  CRUD · Geofence · Cron · AI Proxy              │
└──────┬──────────────────────────┬───────────────┘
       │ pg driver                │ HTTP
┌──────▼──────────┐   ┌──────────▼───────────────┐
│   PostgreSQL     │   │  Python FastAPI (port     │
│   (port 5432)    │   │  8000) · XGBoost Models  │
└──────────────────┘   └──────────────────────────┘
```

---

## 🚀 Quick Start

### Option A — Docker Compose (Recommended)

> **Prerequisites:** Docker Desktop installed and running.

```bash
# Clone / enter the project
cd goofy-bose

# Start all services (DB, AI engine, backend, frontend)
docker-compose up --build

# Access the dashboard
open http://localhost:3000
```

The database is automatically seeded with:
- 1 CHC facility
- 12 medicines (3 critical, 2 warning, 7 OK)
- 12 beds across 3 wards
- 6 staff members
- 30 days of historical patient visit data
- 7-day AI forecast pre-loaded

---

### Option B — Manual Local Setup

#### Prerequisites
- **Node.js** v18+
- **Python 3.10** (exact version)
- **PostgreSQL** 14+

---

#### Step 1 — Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE smart_health;"

# Run schema
psql -U postgres -d smart_health -f backend/src/db/schema.sql

# Seed with sample data
psql -U postgres -d smart_health -f backend/src/db/seed.sql
```

---

#### Step 2 — Backend (Node.js)

```bash
cd backend

# Copy and edit environment variables
cp .env.example .env
# Edit .env: set DB_PASSWORD, confirm DB credentials

# Install dependencies
npm install

# Start development server
npm run dev
# → API running at http://localhost:5000
```

---

#### Step 3 — AI Engine (Python 3.10)

```bash
cd ai-engine

# Create virtual environment with Python 3.10
python3.10 -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the AI microservice
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# → AI Engine running at http://localhost:8000
# → Docs at http://localhost:8000/docs
```

---

#### Step 4 — Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → Dashboard running at http://localhost:3000
```

---

## 📡 API Reference

### Backend (Node.js — port 5000)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Aggregated KPIs for overview page |
| `GET` | `/api/medicines` | All medicines with stockout alerts |
| `PUT` | `/api/medicines/:id/consume` | Decrement stock + update burn rate |
| `PUT` | `/api/medicines/:id/restock` | Add stock |
| `GET` | `/api/beds` | All beds (filter: `?ward=General`) |
| `GET` | `/api/beds/summary` | Count by status |
| `PUT` | `/api/beds/:id/status` | Update bed status |
| `POST` | `/api/attendance/checkin` | Geofenced check-in |
| `GET` | `/api/attendance/today` | Today's attendance log |
| `GET` | `/api/forecast/footfall` | 7-day AI footfall forecast |
| `GET` | `/api/forecast/stockout` | Medicines with warning/critical alerts |
| `POST` | `/api/forecast/refresh` | Manually trigger AI forecast refresh |

### AI Engine (Python FastAPI — port 8000)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `POST` | `/predict/footfall` | 7-day footfall forecast |
| `POST` | `/predict/stockout` | Days-to-stockout per medicine |
| `GET` | `/predict/footfall/sample` | Demo forecast (no body needed) |
| `GET` | `/docs` | Interactive Swagger UI |

---

## 🤖 AI Model Details

### Footfall Forecasting (XGBoost Regressor)
- **Training data:** 90 days of historical patient visits
- **Features:** `day_of_week`, `month`, `is_weekend`, `day_of_month`, `week_of_year`, `lag_7`, `lag_14`, `rolling_avg_7`, `rolling_avg_14`
- **Output:** 7-day prediction with day name and weekend flag
- **Schedule:** Refreshed nightly at midnight via node-cron

### Stockout Prediction (Rule-Based Burn Rate)
- **Formula:** `days_remaining = current_stock / avg_daily_consumption`
- **Alert levels:** `critical` (≤3 days), `warning` (≤7 days), `ok` (>7 days)
- **Trigger:** Alerts fired 7 days before estimated stockout

---

## 📍 Geofenced Attendance

The check-in system uses the browser's native `navigator.geolocation` API:
1. Staff opens the Staff & Attendance page on any device
2. Clicks **"Check In"** and selects their name
3. Browser requests GPS coordinates
4. Backend runs **Haversine formula** to measure distance from facility
5. If within **200 meters** → marked **Present** ✅
6. If outside → marked **Absent** ❌ with distance shown

Configure the facility's coordinates in `.env`:
```env
FACILITY_LAT=28.6139
FACILITY_LNG=77.2090
GEOFENCE_RADIUS_METERS=200
```

---

## 🗄️ Database Schema

```
facilities          → PHC/CHC locations (lat/lng)
medicine_inventory  → Stock levels, burn rates, thresholds
beds                → Bed status by ward
staff               → Doctor/nurse/pharmacist records
attendance_logs     → Geofenced check-in records
patient_visits      → Daily footfall counts
footfall_forecast   → AI-generated 7-day predictions
stockout_alerts     → Medicine stockout warnings
medicine_consumption_log → Per-transaction consumption history
```

---

## 🎨 UI Design System

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#080c18` | Page background |
| `--bg-card` | `rgba(17,24,39,0.8)` | Glass cards |
| `--accent-teal` | `#00d4aa` | Primary accent, active states |
| `--accent-amber` | `#f59e0b` | Warnings, alerts |
| `--accent-red` | `#ef4444` | Critical alerts |
| Font | Inter (Google Fonts) | All text |

---

## 📁 Project Structure

```
goofy-bose/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── db/         (pool.js, schema.sql, seed.sql)
│       ├── routes/     (medicines, beds, staff, attendance, patients, forecast, dashboard)
│       ├── services/   (geofenceService, aiClient, cronService)
│       └── index.js
├── ai-engine/
│   ├── main.py
│   ├── forecasting.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── data/sample_visits.csv
└── frontend/
    ├── index.html
    ├── index.css
    ├── vite.config.js
    └── src/
        ├── api/        (index.js with mock data fallback)
        ├── components/ (KPICard, BedGrid, MedicineTable, AttendanceWidget, ForecastChart, StockoutAlert)
        ├── pages/      (Overview, Inventory, Beds, Staff, Forecast)
        ├── App.jsx
        └── main.jsx
```

---

## 🐛 Troubleshooting

**Backend can't connect to DB:**
- Ensure PostgreSQL is running: `pg_isready -U postgres`
- Check `.env` credentials match your PostgreSQL setup

**AI Engine not responding:**
- Verify Python 3.10 is active: `python --version`
- Check uvicorn started on port 8000: `curl http://localhost:8000/health`
- Frontend gracefully falls back to cached/mock data

**Geofence always returning Outside:**
- Update `FACILITY_LAT` / `FACILITY_LNG` in `.env` to your actual facility coordinates
- For local testing, you can temporarily increase `GEOFENCE_RADIUS_METERS=50000`
