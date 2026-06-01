-- MediCare PRO - Fresh Database Schema
-- Run in Supabase SQL Editor

-- Drop existing tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS adherence_records CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS caregiver_patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient','caregiver','admin')),
  is_active     BOOLEAN DEFAULT TRUE,
  is_verified   BOOLEAN DEFAULT TRUE,
  notify_email  BOOLEAN DEFAULT TRUE,
  notify_push   BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  last_login    TIMESTAMP
);

-- CAREGIVER-PATIENT LINKS
CREATE TABLE caregiver_patients (
  id           SERIAL PRIMARY KEY,
  caregiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'Caregiver',
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_id)
);

-- MEDICATIONS
CREATE TABLE medications (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,
  dosage       VARCHAR(50) NOT NULL,
  frequency    VARCHAR(50) NOT NULL,
  times        TEXT[] NOT NULL,
  category     VARCHAR(50) DEFAULT 'General',
  instructions TEXT,
  start_date   DATE NOT NULL,
  end_date     DATE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- REMINDERS
CREATE TABLE reminders (
  id             SERIAL PRIMARY KEY,
  medication_id  INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_time TIME NOT NULL,
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status         VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','taken','missed','snoozed')),
  taken_at       TIMESTAMP,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(medication_id, scheduled_date, scheduled_time)
);

-- ADHERENCE RECORDS
CREATE TABLE adherence_records (
  id            SERIAL PRIMARY KEY,
  reminder_id   INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  action        VARCHAR(20) NOT NULL CHECK (action IN ('taken','missed','snoozed')),
  action_time   TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_id INTEGER REFERENCES reminders(id) ON DELETE SET NULL,
  type        VARCHAR(30) NOT NULL DEFAULT 'reminder',
  title       VARCHAR(200) NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_meds_user ON medications(user_id);
CREATE INDEX idx_rems_user_date ON reminders(user_id, scheduled_date);
CREATE INDEX idx_rems_status ON reminders(status);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read);
CREATE INDEX idx_cg ON caregiver_patients(caregiver_id, patient_id);

-- ================================================================
-- SEED DATA
-- All passwords = Test@1234
-- Hash generated with bcrypt rounds=10
-- ================================================================

-- Admin account: gaurabbhusal7@gmail.com / Test@1234
INSERT INTO users (full_name, email, password_hash, role)
VALUES ('Gaurab Bhusal', 'gaurabbhusal7@gmail.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');

-- Test patient: patient@test.com / Test@1234
INSERT INTO users (full_name, email, password_hash, phone, role)
VALUES ('Sarah Johnson', 'patient@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '+61411111111', 'patient');

-- Test caregiver: caregiver@test.com / Test@1234
INSERT INTO users (full_name, email, password_hash, phone, role)
VALUES ('Mary Johnson', 'caregiver@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '+61422222222', 'caregiver');

-- Link caregiver to patient
INSERT INTO caregiver_patients (caregiver_id, patient_id, relationship)
VALUES (3, 2, 'Daughter');

-- Sample medications for patient
INSERT INTO medications (user_id,name,dosage,frequency,times,category,instructions,start_date)
VALUES
(2,'Metformin','500mg','Twice daily',ARRAY['08:00','20:00'],'Morning & Evening','Take with food',CURRENT_DATE-30),
(2,'Amlodipine','5mg','Once daily',ARRAY['08:00'],'Morning','Take in morning',CURRENT_DATE-30),
(2,'Vitamin D3','1000IU','Once daily',ARRAY['13:00'],'Afternoon','Take after lunch',CURRENT_DATE-30);

-- Today's reminders
INSERT INTO reminders (medication_id,user_id,scheduled_time,scheduled_date,status)
VALUES
(1,2,'08:00',CURRENT_DATE,'taken'),
(2,2,'08:00',CURRENT_DATE,'taken'),
(3,2,'13:00',CURRENT_DATE,'pending'),
(1,2,'20:00',CURRENT_DATE,'pending');

COMMIT;
