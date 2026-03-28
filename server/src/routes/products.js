const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, (req, res) => {
  try {
    const { status, search, limit, offset } = req.query;
    const products = Product.findByUser(req.user.userId, { status, search, limit: +limit || 50, offset: +offset || 0 });
    const total = Product.countByUser(req.user.userId);
    res.json({ success: true, products: products.map(Product.toPublic), total });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product || product.user_id !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product: Product.toPublic(product) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const existing = req.body.asin ? Product.findByAsin(req.user.userId, req.body.asin) : null;
    let product;
    if (existing) {
      product = Product.update(existing.id, req.body);
    } else {
      product = Product.create({ ...req.body, userId: req.user.userId });
    }
    res.json({ success: true, product: Product.toPublic(product) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product || product.user_id !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const updated = Product.update(req.params.id, req.body);
    res.json({ success: true, product: Product.toPublic(updated) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product || product.user_id !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    Product.deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
