const { v4: uuidv4 } = require('uuid');
const { runSql, getSql, allSql } = require('../database');

exports.create = (data) => {
  const id = uuidv4();
  const { userId, title, slug, description, coverImage, seoTitle, seoDescription, seoKeywords, status } = data;
  runSql(
    `INSERT INTO collections (id, user_id, title, slug, description, cover_image, seo_title, seo_description, seo_keywords, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, title, slug, description || null, coverImage || null, seoTitle || null, seoDescription || null, seoKeywords || null, status || 'draft']
  );
  return exports.findById(id);
};

exports.findById = (id) => getSql('SELECT * FROM collections WHERE id = ?', [id]);
exports.findBySlug = (slug) => getSql('SELECT * FROM collections WHERE slug = ?', [slug]);

exports.findByUser = (userId, opts = {}) => {
  const { status, limit = 50, offset = 0 } = opts;
  let sql = 'SELECT * FROM collections WHERE user_id = ?';
  const params = [userId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return allSql(sql, params);
};

exports.findAll = (opts = {}) => {
  const { status, limit = 50, offset = 0 } = opts;
  let sql = 'SELECT * FROM collections WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return allSql(sql, params);
};

exports.countByUser = (userId) => (getSql('SELECT COUNT(*) as c FROM collections WHERE user_id = ?', [userId]) || {}).c || 0;

exports.update = (id, data) => {
  const fields = []; const values = [];
  const map = {
    title: 'title', slug: 'slug', description: 'description',
    coverImage: 'cover_image', seoTitle: 'seo_title',
    seoDescription: 'seo_description', seoKeywords: 'seo_keywords', status: 'status',
  };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) { fields.push(`${col} = ?`); values.push(data[key]); }
  }
  if (data.status === 'published') fields.push('published_at = CURRENT_TIMESTAMP');
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  runSql(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`, values);
  return exports.findById(id);
};

exports.deleteCollection = (id) => runSql('DELETE FROM collections WHERE id = ?', [id]);

exports.addProduct = (collectionId, productId, sortOrder = 0, note = null) => {
  const id = uuidv4();
  try {
    runSql('INSERT INTO collection_products (id, collection_id, product_id, sort_order, note) VALUES (?, ?, ?, ?, ?)', [id, collectionId, productId, sortOrder, note]);
  } catch (e) {
    if (!e.message.includes('UNIQUE')) throw e;
  }
};

exports.removeProduct = (collectionId, productId) => runSql('DELETE FROM collection_products WHERE collection_id = ? AND product_id = ?', [collectionId, productId]);

exports.getProducts = (collectionId) => allSql(
  `SELECT cp.id as cp_id, cp.sort_order, cp.note, cp.created_at as cp_created,
          p.id as product_id, p.asin, p.title, p.price, p.images, p.url, p.affiliate_url, p.status as product_status
   FROM collection_products cp
   JOIN products p ON cp.product_id = p.id
   WHERE cp.collection_id = ?
   ORDER BY cp.sort_order ASC`,
  [collectionId]
);

exports.toPublic = (c) => c ? {
  id: c.id, userId: c.user_id, title: c.title, slug: c.slug,
  description: c.description, coverImage: c.cover_image,
  seoTitle: c.seo_title, seoDescription: c.seo_description, seoKeywords: c.seo_keywords,
  status: c.status, publishedAt: c.published_at, createdAt: c.created_at, updatedAt: c.updated_at,
} : null;
