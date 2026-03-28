const { v4: uuidv4 } = require('uuid');
const { runSql, getSql, allSql } = require('../database');

exports.log = (data) => {
  const id = uuidv4();
  runSql(
    `INSERT INTO click_logs (id, product_id, collection_id, affiliate_url, referrer, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.productId || null, data.collectionId || null, data.affiliateUrl || null, data.referrer || null, data.ip || null, data.userAgent || null]
  );
};

exports.countByProduct = (productId) => (getSql('SELECT COUNT(*) as c FROM click_logs WHERE product_id = ?', [productId]) || {}).c || 0;

exports.countByCollection = (collectionId) => (getSql('SELECT COUNT(*) as c FROM click_logs WHERE collection_id = ?', [collectionId]) || {}).c || 0;

exports.totalClicks = () => (getSql('SELECT COUNT(*) as c FROM click_logs') || {}).c || 0;

exports.totalClicksLastDays = (days) => (getSql(`SELECT COUNT(*) as c FROM click_logs WHERE created_at >= datetime('now', ?)`, [`-${days} days`]) || {}).c || 0;

exports.dailyClicks = (days = 30) => allSql(
  `SELECT date(created_at) as date, COUNT(*) as count FROM click_logs WHERE created_at >= datetime('now', ?) GROUP BY date(created_at) ORDER BY date ASC`,
  [`-${days} days`]
);

exports.topProducts = (limit = 10) => allSql(
  `SELECT product_id, p.title, p.asin, COUNT(*) as clicks FROM click_logs cl LEFT JOIN products p ON cl.product_id = p.id GROUP BY product_id ORDER BY clicks DESC LIMIT ?`,
  [limit]
);
