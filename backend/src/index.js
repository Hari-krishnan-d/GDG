require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Route imports
const authRouter      = require('./routes/auth');
const medicinesRouter  = require('./routes/medicines');
const bedsRouter       = require('./routes/beds');
const staffRouter      = require('./routes/staff');
const attendanceRouter = require('./routes/attendance');
const patientsRouter   = require('./routes/patients');
const forecastRouter   = require('./routes/forecast');
const dashboardRouter  = require('./routes/dashboard');

// Services
const { startCronJobs } = require('./services/cronService');

// ────────────────────────────────────────────
// App setup
// ────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────
app.use(cors({
  origin: '*', // Allow all origins in dev; restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ────────────────────────────────────────────
// Health check (no auth required)
// ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart Health PHC/CHC Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ────────────────────────────────────────────
// API Routes
// ────────────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/medicines',  medicinesRouter);
app.use('/api/beds',       bedsRouter);
app.use('/api/staff',      staffRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/patients',   patientsRouter);
app.use('/api/forecast',   forecastRouter);
app.use('/api/dashboard',  dashboardRouter);

// ────────────────────────────────────────────
// 404 handler
// ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

// ────────────────────────────────────────────
// Global error handler
// ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Express] Unhandled error:', err);
  res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
});

// ────────────────────────────────────────────
// Start server (local only — Vercel handles listen automatically)
// ────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║      Smart Health PHC/CHC AI Management API       ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║  Server running on  → http://localhost:${PORT}       ║`);
    console.log(`║  AI Engine URL      → ${process.env.AI_ENGINE_URL || 'http://localhost:8000'}      ║`);
    console.log(`║  Database           → ${process.env.DB_NAME || 'smart_health'}@${process.env.DB_HOST || 'localhost'}     ║`);
    console.log('║                                                   ║');
    console.log('║  Endpoints:                                       ║');
    console.log('║   GET  /health                                    ║');
    console.log('║   *    /api/medicines                             ║');
    console.log('║   *    /api/beds                                  ║');
    console.log('║   *    /api/staff                                 ║');
    console.log('║   *    /api/attendance                            ║');
    console.log('║   *    /api/patients                              ║');
    console.log('║   *    /api/forecast                              ║');
    console.log('║   GET  /api/dashboard/summary                     ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');

    // Start scheduled cron jobs (local only; Vercel uses vercel.json crons)
    startCronJobs();
  });
}

// Export for Vercel serverless handler
module.exports = app;
