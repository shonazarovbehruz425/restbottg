const db = require('../db');

function getToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const headerToken = req.headers['x-session-token'];
  if (headerToken && String(headerToken).trim()) {
    return String(headerToken).trim();
  }
  return null;
}

function requireAdmin(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const session = db.prepare(
      'SELECT * FROM admin_sessions WHERE session_token = ? AND expires_at > ?'
    ).get(token, new Date().toISOString());
    if (!session) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.admin = { username: session.username, expires_at: session.expires_at };
    return next();
  } catch (err) {
    console.error('requireAdmin error:', err && err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = requireAdmin;
module.exports.requireAdmin = requireAdmin;
