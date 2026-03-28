const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cj-atplist.db');
let db = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function runSql(sql, params = []) {
  try {
    db.run(sql, params);
    saveDb();
    return { changes: db.getRowsModified() };
  } catch (err) {
    throw err;
  }
}

function getSql(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function allSql(sql, params = []) {
  const rows = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

async function initDatabase() {
  console.log('[DB] Initializing...');
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('[DB] Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('[DB] Created new database');
  }

  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      asin TEXT NOT NULL,
      title TEXT NOT NULL,
      price TEXT,
      description TEXT,
      bullet_points TEXT,
      images TEXT,
      videos TEXT,
      details TEXT,
      reviews TEXT,
      url TEXT,
      affiliate_url TEXT,
      category TEXT,
      tags TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      cover_image TEXT,
      seo_title TEXT,
      seo_description TEXT,
      seo_keywords TEXT,
      status TEXT DEFAULT 'draft',
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS collection_products (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(collection_id, product_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS click_logs (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      collection_id TEXT,
      affiliate_url TEXT,
      referrer TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_click_logs_product ON click_logs(product_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_click_logs_created ON click_logs(created_at)`);

  saveDb();
  console.log('[DB] All tables ready');
}

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

module.exports = { initDatabase, getDb, runSql, getSql, allSql, saveDb };
