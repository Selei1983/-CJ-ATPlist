const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { runSql, getSql, allSql } = require('../database');

const KEY_PREFIX = 'cj_';

exports.generate = (userId, name) => {
  const id = uuidv4();
  const rawKey = KEY_PREFIX + crypto.randomBytes(24).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 8);

  runSql(
    `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix) VALUES (?, ?, ?, ?, ?)`,
    [id, userId, name, keyHash, keyPrefix]
  );

  return { id, name, key: rawKey, keyPrefix, createdAt: new Date().toISOString() };
};

exports.verify = (rawKey) => {
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const record = getSql(
    `SELECT ak.*, u.role, u.email, u.name as user_name FROM api_keys ak JOIN users u ON ak.user_id = u.id WHERE ak.key_hash = ? AND ak.status = 'active'`,
    [keyHash]
  );
  if (!record) return null;

  runSql('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?', [record.id]);

  return {
    userId: record.user_id,
    email: record.email,
    role: record.role,
    name: record.user_name,
    apiKeyId: record.id,
    apiKeyName: record.name,
  };
};

exports.findByUser = (userId) => allSql(
  `SELECT id, name, key_prefix, status, last_used_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
  [userId]
);

exports.findById = (id) => getSql('SELECT * FROM api_keys WHERE id = ?', [id]);

exports.revoke = (id, userId) => {
  const key = getSql('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', [id, userId]);
  if (!key) return false;
  runSql('UPDATE api_keys SET status = ? WHERE id = ?', ['revoked', id]);
  return true;
};

exports.deleteKey = (id, userId) => {
  const key = getSql('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', [id, userId]);
  if (!key) return false;
  runSql('DELETE FROM api_keys WHERE id = ?', [id]);
  return true;
};

exports.countByUser = (userId) => (getSql('SELECT COUNT(*) as c FROM api_keys WHERE user_id = ? AND status = ?', [userId, 'active']) || {}).c || 0;
