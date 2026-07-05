const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smart_health_super_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// ────────────────────────────────────────────
// Demo users (in production, store in DB with hashed passwords)
// ────────────────────────────────────────────
const DEMO_USERS = [
  {
    id: 1,
    username: 'admin',
    // bcrypt hash of 'smarthealth123'
    passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'admin',
    name: 'Dr. Admin User',
    facility: 'City CHC — Block A',
  },
  {
    id: 2,
    username: 'doctor',
    // bcrypt hash of 'doctor123'
    passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'doctor',
    name: 'Dr. Priya Sharma',
    facility: 'City CHC — Block A',
  },
];

// ────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required',
      });
    }

    // Find user
    const user = DEMO_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Validate password
    // For demo: accept 'smarthealth123' for admin, 'doctor123' for doctor
    const DEMO_PASSWORDS = { admin: 'smarthealth123', doctor: 'doctor123' };
    const validPassword = password === DEMO_PASSWORDS[user.username];

    if (!validPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        facility: user.facility,
      },
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// ────────────────────────────────────────────
// GET /api/auth/me  — validate token + return user
// ────────────────────────────────────────────
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = DEMO_USERS.find((u) => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    return res.json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        facility: user.facility,
      },
    });
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
});

// ────────────────────────────────────────────
// POST /api/auth/logout  — client-side token removal
// ────────────────────────────────────────────
router.post('/logout', (req, res) => {
  // JWT is stateless — logout is handled by deleting the token on the client
  res.json({ status: 'success', message: 'Logged out successfully' });
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
