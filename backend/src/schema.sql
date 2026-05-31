-- ============================================================
-- Pharmacy Medication Reminder System - Database Schema
-- Based on SRS Section 7 (ERD Design)
-- ============================================================

-- Drop existing tables (order matters for foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS adherence_records CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS caregivers CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. USERS TABLE
-- Stores patients, caregivers, and admins
-- ============================================================
CREATE TABLE users (
  user_id     SERIAL PRIMARY KEY,
  full_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  phone_number VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'patient'
                CHECK (role IN ('patient', 'caregiver', 'admin')),
  is_active   BOOLEAN DEFAULT TRUE,
  date_created TIMESTAMP DEFAULT NOW(),
  last_login  TIMESTAMP
);

-- ============================================================
-- 2. MEDICATIONS TABLE
-- Stores medication details entered by users
-- ============================================================
CREATE TABLE medications (
  medication_id   SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  medication_name VARCHAR(150) NOT NULL,
  dosage          VARCHAR(50) NOT NULL,
  frequency       VARCHAR(50) NOT NULL,
  times           TEXT[] NOT NULL,          -- e.g. {"08:00","20:00"}
  category        VARCHAR(50) DEFAULT 'General',
  instructions    TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. REMINDERS TABLE
-- Stores reminder schedules linked to medications
-- ============================================================
CREATE TABLE reminders (
  reminder_id     SERIAL PRIMARY KEY,
  medication_id   INTEGER NOT NULL REFERENCES medications(medication_id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reminder_time   TIME NOT NULL,
  reminder_date   DATE NOT NULL,
  reminder_type   VARCHAR(30) DEFAULT 'push'
                    CHECK (reminder_type IN ('push', 'email', 'sms', 'all')),
  status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'taken', 'missed', 'snoozed')),
  sent_at         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. ADHERENCE RECORDS TABLE
-- Tracks whether medication was taken, missed, or delayed
-- ============================================================
CREATE TABLE adherence_records (
  adherence_id    SERIAL PRIMARY KEY,
  reminder_id     INTEGER NOT NULL REFERENCES reminders(reminder_id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  taken_status    VARCHAR(20) NOT NULL
                    CHECK (taken_status IN ('taken', 'missed', 'delayed', 'skipped')),
  taken_time      TIMESTAMP,
  notes           TEXT,
  recorded_at     TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. CAREGIVERS TABLE
-- Links caregivers to patient accounts
-- ============================================================
CREATE TABLE caregivers (
  caregiver_id    SERIAL PRIMARY KEY,
  patient_id      INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  caregiver_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  caregiver_name  VARCHAR(100) NOT NULL,
  caregiver_email VARCHAR(150) NOT NULL,
  caregiver_phone VARCHAR(20),
  relationship    VARCHAR(50),
  is_active       BOOLEAN DEFAULT TRUE,
  linked_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. PRESCRIPTIONS TABLE
-- Stores prescription files uploaded by users
-- ============================================================
CREATE TABLE prescriptions (
  prescription_id SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  file_name       VARCHAR(255) NOT NULL,
  file_path       VARCHAR(500) NOT NULL,
  file_size       INTEGER,
  doctor_name     VARCHAR(100),
  upload_date     TIMESTAMP DEFAULT NOW(),
  notes           TEXT
);

-- ============================================================
-- 7. NOTIFICATIONS TABLE
-- Logs all alerts and notifications sent by the system
-- ============================================================
CREATE TABLE notifications (
  notification_id   SERIAL PRIMARY KEY,
  reminder_id       INTEGER REFERENCES reminders(reminder_id) ON DELETE SET NULL,
  user_id           INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL
                      CHECK (notification_type IN ('email', 'sms', 'push', 'caregiver_alert')),
  title             VARCHAR(200),
  message           TEXT NOT NULL,
  sent_time         TIMESTAMP DEFAULT NOW(),
  delivery_status   VARCHAR(20) DEFAULT 'sent'
                      CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'pending'))
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_medications_user_id ON medications(user_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_adherence_user_id ON adherence_records(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_caregivers_patient_id ON caregivers(patient_id);

-- ============================================================
-- SAMPLE ADMIN USER (password: Admin@1234)
-- ============================================================
INSERT INTO users (full_name, email, phone_number, password_hash, role)
VALUES (
  'System Admin',
  'admin@medicare.com',
  '+61400000000',
  '$2a$10$XwQ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN',
  'admin'
);

COMMIT;
