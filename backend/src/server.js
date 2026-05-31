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
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(compression());

// ─── CORS — allow all Vercel + localhost ──────────────────────
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow localhost
    if (origin.includes('localhost')) return callback(null, true);
    // Allow all vercel.app domains
    if (origin.includes('vercel.app')) return callback(null, true);
    // Allow railway.app
    if (origin.includes('railway.app')) return callback(null, true);
    // Allow custom CLIENT_URL
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
    callback(null, true); // Allow all for now
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ─── Logging ──────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));

// ─── Rate Limiting ────────────────────────────────────────────
app.use('/api/auth/login',    rateLimit({ windowMs:15*60*1000, max:10, message:{error:'Too many login attempts.'} }));
app.use('/api/auth/register', rateLimit({ windowMs:60*60*1000, max:5,  message:{error:'Too many registrations.'} }));
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

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
const start = async () => {
  try {
    await pool.query('SELECT NOW()');
    logger.info('✅ PostgreSQL connected');
    app.listen(PORT, () => {
      logger.info(`🚀 MediCare API running on port ${PORT}`);
    });
    startScheduler();
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

start();
module.exports = app;
