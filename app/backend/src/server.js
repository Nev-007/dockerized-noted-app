require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { initDB } = require('./config/db');
const notesRoutes = require('./routes/notes.routes');

const app = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ───────────────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],   // inline <script> in index.html
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json());

/* ── Static frontend ─────────────────────────────── */
// Serve the bundled frontend from /app/src/public inside the container.
// For local dev, override FRONTEND_PATH in your .env if needed.
const FRONTEND_DIR = path.resolve(__dirname, process.env.FRONTEND_PATH || './public');
app.use(express.static(FRONTEND_DIR));

/* ── API routes ──────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

app.use('/api/notes', notesRoutes);

/* ── API 404 handler (unknown /api/* routes) ─────── */
// Must come BEFORE the global error handler and SPA fallback
// so that unknown API paths return JSON 404 instead of index.html.
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

/* ── Global error handler (catches malformed JSON) ─ */
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON in request body' });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});

/* ── SPA fallback ────────────────────────────────── */
// Must come AFTER the API 404 handler and global error handler.
app.get('*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

/* ── Boot ─────────────────────────────────────────── */
(async () => {
  try {
    await initDB();
    app.listen(PORT, () => console.log(`🚀  Noted API listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
