const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { generateToken, verifyToken } = require('../middleware/auth');

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const decoded = verifyToken(header.substring(7));
  if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });
  req.user = decoded;
  next();
};

const adminMiddleware = async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'email, password, name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });

    const user = await User.createUser({ email, password, name });
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ success: true, token, user: User.toPublic(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }
    const user = await User.verifyPassword(email, password);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ success: true, token, user: User.toPublic(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user: User.toPublic(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true });
});

module.exports = { router, authMiddleware, adminMiddleware };
