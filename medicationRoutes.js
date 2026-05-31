require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');
const { startScheduler } = require('./utils/scheduler');
const { pool } = require('./config/db');
const logger   = require('./utils/logger');

const app  = express();
const PORT = process.env.PORT || 5000;

// Body parser FIRST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({ origin: '*', credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));

// Routes
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error', { error: err.message });
  res.status(500).json({ error: err.message });
});

const start = async () => {
  try {
    await pool.query('SELECT NOW()');
    logger.info('✅ PostgreSQL connected');
    app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
    startScheduler();
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
};

start();
module.exports = app;
