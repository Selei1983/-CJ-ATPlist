const { v4: uuidv4 } = require('uuid');
const { runSql, getSql, allSql } = require('../database');

exports.create = (data) => {
  const id = uuidv4();
  const { userId, asin, title, price, description, bulletPoints, images, videos, details, reviews, url, affiliateUrl, category, tags } = data;
  runSql(
    `INSERT INTO products (id, user_id, asin, title, price, description, bullet_points, images, videos, details, reviews, url, affiliate_url, category, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, asin, title, price || null, description || null,
     bulletPoints ? JSON.stringify(bulletPoints) : null,
     images ? JSON.stringify(images) : null,
     videos ? JSON.stringify(videos) : null,
     details ? JSON.stringify(details) : null,
     reviews ? JSON.stringify(reviews) : null,
     url || null, affiliateUrl || null, category || null, tags ? JSON.stringify(tags) : null]
  );
  return exports.findById(id);
};

exports.findById = (id) => getSql('SELECT * FROM products WHERE id = ?', [id]);

exports.findByAsin = (userId, asin) => getSql('SELECT * FROM products WHERE user_id = ? AND asin = ?', [userId, asin]);

exports.findByUser = (userId, opts = {}) => {
  let sql = 'SELECT * FROM products WHERE user_id = ?';
  const params = [userId];
  if (opts.status) { sql += ' AND status = ?'; params.push(opts.status); }
  if (opts.search) { sql += ' AND (title LIKE ? OR asin LIKE ?)'; params.push(`%${opts.search}%`, `%${opts.search}%`); }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(opts.limit || 50, opts.offset || 0);
  return allSql(sql, params);
};

exports.countByUser = (userId) => (getSql('SELECT COUNT(*) as c FROM products WHERE user_id = ?', [userId]) || {}).c || 0;

exports.update = (id, data) => {
  const map = {
    title: 'title', price: 'price', description: 'description', category: 'category',
    status: 'status', url: 'url', affiliateUrl: 'affiliate_url',
    bulletPoints: 'bullet_points', images: 'images', videos: 'videos',
    details: 'details', reviews: 'reviews', tags: 'tags',
  };
  const fields = []; const values = [];
  for (const [k, col] of Object.entries(map)) {
    if (data[k] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(typeof data[k] === 'object' && data[k] !== null ? JSON.stringify(data[k]) : data[k]);
    }
  }
  if (!fields.length) return exports.findById(id);
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  runSql(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  return exports.findById(id);
};

exports.deleteProduct = (id) => runSql('DELETE FROM products WHERE id = ?', [id]);

exports.countAll = () => (getSql('SELECT COUNT(*) as c FROM products') || {}).c || 0;

exports.toPublic = (p) => p ? {
  id: p.id, userId: p.user_id, asin: p.asin, title: p.title, price: p.price,
  description: p.description,
  bulletPoints: p.bullet_points ? JSON.parse(p.bullet_points) : [],
  images: p.images ? JSON.parse(p.images) : [],
  videos: p.videos ? JSON.parse(p.videos) : [],
  details: p.details ? JSON.parse(p.details) : [],
  reviews: p.reviews ? JSON.parse(p.reviews) : [],
  url: p.url, affiliateUrl: p.affiliate_url, category: p.category,
  tags: p.tags ? JSON.parse(p.tags) : [],
  status: p.status, createdAt: p.created_at, updatedAt: p.updated_at,
} : null;
