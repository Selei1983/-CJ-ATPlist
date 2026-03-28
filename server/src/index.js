const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const collectionRoutes = require('./routes/collections');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes.router);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'CJ-ATPlist Server', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use('/admin', express.static(path.join(__dirname, '..', '..', 'admin', 'dist')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'admin', 'dist', 'index.html'));
});

app.use('/site', express.static(path.join(__dirname, '..', '..', 'site', 'dist')));
app.get('/site/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'site', 'dist', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use((err, req, res, _next) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('  CJ-ATPlist Server v1.0.0');
    console.log('========================================');
    console.log(`  API:      http://localhost:${PORT}/api`);
    console.log(`  Admin:    http://localhost:${PORT}/admin`);
    console.log(`  Site:     http://localhost:${PORT}/site`);
    console.log('========================================');
    console.log('');
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
