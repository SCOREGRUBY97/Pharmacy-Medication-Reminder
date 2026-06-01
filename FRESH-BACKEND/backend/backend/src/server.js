require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const routes  = require('./routes');
const { pool } = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// Body parser FIRST - very important
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS - allow everything
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Security
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

// Routes
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

// Start
const start = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    app.listen(PORT, () => console.log(`🚀 MediCare API running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  }
};

start();
module.exports = app;
