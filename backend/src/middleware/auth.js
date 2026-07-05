const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'smart_health_super_secret_key_2024';

/**
 * Express middleware that validates a Bearer JWT token.
 * Attaches the decoded payload to req.user on success.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token. Please log in again.',
    });
  }
}

/**
 * Middleware that checks if the authenticated user has admin role.
 * Must be used after authenticateToken.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin role required.',
    });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
