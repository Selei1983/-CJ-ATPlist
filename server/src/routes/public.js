const express = require('express');
const router = express.Router();
const Collection = require('../models/collection');
const ClickLog = require('../models/clickLog');
const { getSql, allSql } = require('../database');

const Product = require('../models/product');

const User = require('../models/user');

router.get('/collections', (req, res) => {
  try {
    const collections = Collection.findAll({ status: 'published' });
    const enriched = collections.map(c => {
      const products = Collection.getProducts(c.id);
      return { ...Collection.toPublic(c), productCount: products.length };
    });
    res.json({ success: true, collections: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/collections/:slug', (req, res) => {
  try {
    const collection = Collection.findBySlug(req.params.slug);
    if (!collection || collection.status !== 'published') {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    const products = Collection.getProducts(collection.id);
    const enrichedProducts = products.map(p => ({
      id: p.product_id,
      asin: p.asin,
      title: p.title,
      price: p.price,
      images: p.images ? JSON.parse(p.images) : [],
      url: p.affiliate_url || p.url,
      note: p.note,
    }));
    res.json({ success: true, collection: Collection.toPublic(collection), products: enrichedProducts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/products/:asin', (req, res) => {
  try {
    const product = getSql('SELECT * FROM products WHERE asin = ? AND status = ?', [req.params.asin, 'active']);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, product: Product.toPublic(product) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/click', (req, res) => {
  try {
    const { productId, collectionId, affiliateUrl, referrer } = req.body;
    ClickLog.log({
      productId, collectionId, affiliateUrl, referrer,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/settings', (req, res) => {
  try {
    const rows = allSql('SELECT key, value FROM site_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
