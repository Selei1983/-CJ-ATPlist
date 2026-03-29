const express = require('express');
const router = express.Router();
const ApiKey = require('../models/apiKey');
const { authMiddleware } = require('./auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const keys = ApiKey.findByUser(req.user.userId);
    res.json({
      success: true,
      keys: keys.map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.key_prefix,
        status: k.status,
        lastUsedAt: k.last_used_at,
        createdAt: k.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const count = ApiKey.countByUser(req.user.userId);
    if (count >= 10) {
      return res.status(400).json({ success: false, error: 'Maximum 10 active API keys per user' });
    }
    const result = ApiKey.generate(req.user.userId, name.trim());
    res.json({ success: true, key: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id/revoke', (req, res) => {
  try {
    const ok = ApiKey.revoke(req.params.id, req.user.userId);
    if (!ok) return res.status(404).json({ success: false, error: 'API key not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const ok = ApiKey.deleteKey(req.params.id, req.user.userId);
    if (!ok) return res.status(404).json({ success: false, error: 'API key not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
