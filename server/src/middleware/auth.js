const jwt = require('jsonwebtoken');
const ApiKey = require('../models/apiKey');

const SECRET = process.env.JWT_SECRET || 'cj-atplist-secret-change-in-production';
const EXPIRES = '7d';

exports.generateToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
};

exports.authMiddleware = (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader) {
    const userInfo = ApiKey.verify(apiKeyHeader);
    if (!userInfo) return res.status(401).json({ success: false, error: 'Invalid API key' });
    req.user = userInfo;
    req.authType = 'apikey';
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const decoded = exports.verifyToken(header.substring(7));
  if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });
  req.user = decoded;
  req.authType = 'jwt';
  next();
};
