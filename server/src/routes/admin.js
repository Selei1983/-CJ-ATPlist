const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Product = require('../models/product');
const Collection = require('../models/collection');
const ClickLog = require('../models/clickLog');
const { authMiddleware, adminMiddleware } = require('./auth');

router.use(authMiddleware, adminMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = User.findAll().length;
    const totalProducts = Product.countAll();
    const totalCollections = Collection.findAll().length;
    const totalClicks = ClickLog.totalClicks();
    const clicks7d = ClickLog.totalClicksLastDays(7);
    const clicks30d = ClickLog.totalClicksLastDays(30);
    const dailyClicks = ClickLog.dailyClicks(30);
    const topProducts = ClickLog.topProducts(10);
    res.json({
      success: true,
      stats: { totalUsers, totalProducts, totalCollections, totalClicks, clicks7d, clicks30d, dailyClicks, topProducts },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = User.findAll();
    const enriched = users.map((u) => {
      const productCount = Product.countByUser(u.id);
      return { ...User.toPublic(u), productCount };
    });
    res.json({ success: true, users: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    await User.updateRole(req.params.id, role);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
