const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { runSql, getSql, allSql } = require('../database');

exports.createUser = async ({ email, password, name }) => {
  const id = uuidv4();
  const hashed = await bcrypt.hash(password, 10);
  const countResult = getSql('SELECT COUNT(*) as c FROM users');
  const role = countResult.c === 0 ? 'admin' : 'user';
  runSql('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)', [id, email, hashed, name, role]);
  return exports.findById(id);
};

exports.findByEmail = (email) => getSql('SELECT * FROM users WHERE email = ?', [email]);

exports.findById = (id) => getSql('SELECT * FROM users WHERE id = ?', [id]);

exports.verifyPassword = async (email, password) => {
  const user = exports.findByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  return valid ? user : null;
};

exports.findAll = () => allSql('SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC');

exports.updateRole = (id, role) => runSql('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, id]);

exports.deleteUser = (id) => runSql('DELETE FROM users WHERE id = ?', [id]);

exports.toPublic = (user) => user ? {
  id: user.id, email: user.email, name: user.name, role: user.role,
  createdAt: user.created_at, updatedAt: user.updated_at,
} : null;
