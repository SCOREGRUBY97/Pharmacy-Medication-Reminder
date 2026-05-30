// ============================================================
// Pharmacy Medication Reminder System — Backend Server
// Tech: Node.js + Express + PostgreSQL + JWT + Node-cron
// SRS Section 3: System Architecture
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes      = require('./routes/authRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const reminderRoutes  = require('./routes/reminderRoutes');
const caregiverRoutes = require('./routes/caregiverRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const aiRoutes        = require('./routes/aiRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { startSchedulers } = require('./utils/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parser ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (dev) ─────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'MediCare API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/medicines', medicationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api',           caregiverRoutes);   // /api/dashboard, /api/caregiver/*
app.use('/api/admin',     adminRoutes);
app.use('/api/ai',        aiRoutes);

// ─── 404 & Error Handlers ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 MediCare API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);

  // Start cron schedulers
  startSchedulers();
});

module.exports = app; // for testing
