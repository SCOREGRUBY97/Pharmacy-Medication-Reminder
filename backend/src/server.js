require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const compression = require('compression');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const routes     = require('./routes');
const { startScheduler } = require('./utils/scheduler');
const { pool }   = require('./config/db');
const logger     = require('./utils/logger');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ─── Logging ──────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));

// ─── Rate Limiting ────────────────────────────────────────────
app.use('/api/auth/login',    rateLimit({ windowMs:15*60*1000, max:10, message:{error:'Too many login attempts. Try again in 15 minutes.'} }));
app.use('/api/auth/register', rateLimit({ windowMs:60*60*1000, max:5,  message:{error:'Too many registrations. Try again in 1 hour.'} }));
app.use('/api/',              rateLimit({ windowMs:15*60*1000, max:200, message:{error:'Too many requests.'} }));

// ─── Body Parser ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ─── Graceful Shutdown ────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await pool.end();
  process.exit(0);
});
process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection', { reason }));
process.on('uncaughtException',  (err)    => { logger.error('Uncaught exception', { error: err.message }); process.exit(1); });

// ─── Start ────────────────────────────────────────────────────
const start = async () => {
  try {
    await pool.query('SELECT NOW()');
    logger.info('✅ PostgreSQL connected');

    app.listen(PORT, () => {
      logger.info(`🚀 MediCare API v2.0 running`, { port: PORT, env: process.env.NODE_ENV });
      console.log(`
╔══════════════════════════════════════════════╗
║  💊 MediCare API v2.0 — Ready                ║
║  🌍 http://localhost:${PORT}                   ║
║  📋 Health: GET /api/health                  ║
╚══════════════════════════════════════════════╝
      `);
    });

    startScheduler();
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

start();
module.exports = app;
