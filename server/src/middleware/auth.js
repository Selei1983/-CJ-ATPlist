const jwt = require('jsonwebtoken');

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
