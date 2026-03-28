const express = require('express');
const router = express.Router();
const Collection = require('../models/collection');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const collections = Collection.findByUser(req.user.userId, { status, limit: +limit || 50, offset: +offset || 0 });
    const total = Collection.countByUser(req.user.userId);
    res.json({ success: true, collections: collections.map(Collection.toPublic), total });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const collection = Collection.findById(req.params.id);
    if (!collection || collection.user_id !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    const products = Collection.getProducts(req.params.id);
    res.json({ success: true, collection: Collection.toPublic(collection), products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const collection = Collection.create({ ...req.body, userId: req.user.userId });
    res.json({ success: true, collection: Collection.toPublic(collection) });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, error: 'Slug already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    let collection = Collection.findById(req.params.id);
    if (!collection || collection.user_id !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    collection = Collection.update(req.params.id, req.body);
    res.json({ success: true, collection: Collection.toPublic(collection) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const collection = Collection.findById(req.params.id);
    if (!collection || collection.user_id !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    Collection.deleteCollection(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/products', authMiddleware, (req, res) => {
  try {
    const { productId, sortOrder, note } = req.body;
    Collection.addProduct(req.params.id, productId, sortOrder || 0, note);
    const products = Collection.getProducts(req.params.id);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id/products/:productId', authMiddleware, (req, res) => {
  try {
    Collection.removeProduct(req.params.id, req.params.productId);
    const products = Collection.getProducts(req.params.id);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
