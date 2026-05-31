-- ================================================================
-- MEDICARE PHARMACY REMINDER — PRODUCTION DATABASE SCHEMA
-- PostgreSQL 14+
-- Run: psql -U postgres -d pharmacy_db -f schema.sql
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop in correct order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS adherence_records CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS caregiver_patients CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================================================================
-- USERS
-- ================================================================
CREATE TABLE users (
  id                SERIAL PRIMARY KEY,
  uuid              UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  full_name         VARCHAR(100) NOT NULL,
  email             VARCHAR(150) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  phone             VARCHAR(20),
  date_of_birth     DATE,
  gender            VARCHAR(10) CHECK (gender IN ('male','female','other','prefer_not')),
  role              VARCHAR(20) NOT NULL DEFAULT 'patient'
                      CHECK (role IN ('patient','caregiver','admin')),
  avatar_url        TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  is_verified       BOOLEAN DEFAULT FALSE,
  -- Notification preferences
  notify_email      BOOLEAN DEFAULT TRUE,
  notify_push       BOOLEAN DEFAULT TRUE,
  notify_sms        BOOLEAN DEFAULT FALSE,
  push_subscription TEXT,   -- JSON web push subscription
  -- Medical info (patient only)
  medical_conditions TEXT[],
  allergies         TEXT[],
  doctor_name       VARCHAR(100),
  doctor_phone      VARCHAR(20),
  emergency_contact_name  VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  -- Timestamps
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  last_login        TIMESTAMP,
  last_seen         TIMESTAMP
);

-- ================================================================
-- SESSIONS (for token invalidation)
-- ================================================================
CREATE TABLE sessions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  device_info TEXT,
  ip_address  VARCHAR(45),
  is_valid    BOOLEAN DEFAULT TRUE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- PASSWORD RESET TOKENS
-- ================================================================
CREATE TABLE password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- CAREGIVER ↔ PATIENT
-- ================================================================
CREATE TABLE caregiver_patients (
  id            SERIAL PRIMARY KEY,
  caregiver_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship  VARCHAR(50),
  permissions   TEXT[] DEFAULT ARRAY['view_medications','view_reminders','receive_alerts'],
  is_active     BOOLEAN DEFAULT TRUE,
  linked_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_id)
);

-- ================================================================
-- MEDICATIONS
-- ================================================================
CREATE TABLE medications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  generic_name    VARCHAR(150),
  dosage          VARCHAR(50) NOT NULL,
  dosage_unit     VARCHAR(20) DEFAULT 'mg',
  frequency       VARCHAR(50) NOT NULL,
  times           TEXT[] NOT NULL,
  category        VARCHAR(50) DEFAULT 'General',
  medication_type VARCHAR(30) DEFAULT 'tablet'
                    CHECK (medication_type IN ('tablet','capsule','liquid','injection','topical','inhaler','drops','patch','other')),
  color           VARCHAR(30),
  shape           VARCHAR(30),
  instructions    TEXT,
  side_effects    TEXT,
  food_interactions TEXT,
  refill_reminder BOOLEAN DEFAULT FALSE,
  refill_days_before INTEGER DEFAULT 7,
  current_stock   INTEGER,
  start_date      DATE NOT NULL,
  end_date        DATE,
  prescribed_by   VARCHAR(100),
  pharmacy_name   VARCHAR(100),
  prescription_number VARCHAR(50),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- REMINDERS
-- ================================================================
CREATE TABLE reminders (
  id              SERIAL PRIMARY KEY,
  medication_id   INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_time  TIME NOT NULL,
  scheduled_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','taken','missed','snoozed','skipped')),
  notified_at     TIMESTAMP,
  taken_at        TIMESTAMP,
  snoozed_until   TIMESTAMP,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(medication_id, scheduled_date, scheduled_time)
);

-- ================================================================
-- ADHERENCE RECORDS
-- ================================================================
CREATE TABLE adherence_records (
  id              SERIAL PRIMARY KEY,
  reminder_id     INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication_id   INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  action          VARCHAR(20) NOT NULL CHECK (action IN ('taken','missed','snoozed','skipped')),
  action_time     TIMESTAMP DEFAULT NOW(),
  late_by_minutes INTEGER,
  notes           TEXT,
  mood            VARCHAR(20) CHECK (mood IN ('great','good','okay','poor','terrible')),
  side_effects_reported TEXT
);

-- ================================================================
-- PRESCRIPTIONS (file uploads)
-- ================================================================
CREATE TABLE prescriptions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication_id   INTEGER REFERENCES medications(id) ON DELETE SET NULL,
  file_name       VARCHAR(255) NOT NULL,
  file_url        TEXT NOT NULL,
  file_size       INTEGER,
  file_type       VARCHAR(20),
  doctor_name     VARCHAR(100),
  issue_date      DATE,
  expiry_date     DATE,
  notes           TEXT,
  uploaded_at     TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- NOTIFICATIONS
-- ================================================================
CREATE TABLE notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_id     INTEGER REFERENCES reminders(id) ON DELETE SET NULL,
  type            VARCHAR(30) NOT NULL
                    CHECK (type IN ('reminder','missed','caregiver_alert','admin_alert','system','refill','welcome','streak')),
  channel         VARCHAR(20) DEFAULT 'push'
                    CHECK (channel IN ('email','push','sms','in_app')),
  title           VARCHAR(200) NOT NULL,
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  action_url      VARCHAR(255),
  sent_at         TIMESTAMP DEFAULT NOW(),
  read_at         TIMESTAMP,
  delivery_status VARCHAR(20) DEFAULT 'sent'
                    CHECK (delivery_status IN ('pending','sent','delivered','failed'))
);

-- ================================================================
-- AUDIT LOGS (admin compliance)
-- ================================================================
CREATE TABLE audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   INTEGER,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_meds_user         ON medications(user_id);
CREATE INDEX idx_meds_active       ON medications(user_id, is_active);
CREATE INDEX idx_rems_user_date    ON reminders(user_id, scheduled_date);
CREATE INDEX idx_rems_status       ON reminders(status, scheduled_date);
CREATE INDEX idx_rems_notified     ON reminders(notified_at, status);
CREATE INDEX idx_adh_user          ON adherence_records(user_id);
CREATE INDEX idx_adh_date          ON adherence_records(action_time);
CREATE INDEX idx_notif_user_read   ON notifications(user_id, is_read);
CREATE INDEX idx_cg_caregiver      ON caregiver_patients(caregiver_id);
CREATE INDEX idx_cg_patient        ON caregiver_patients(patient_id);
CREATE INDEX idx_sessions_user     ON sessions(user_id, is_valid);
CREATE INDEX idx_audit_user        ON audit_logs(user_id, created_at);

-- ================================================================
-- TRIGGERS — auto-update updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_meds_updated      BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- VIEWS for common queries
-- ================================================================
CREATE VIEW v_today_reminders AS
  SELECT r.*, m.name AS med_name, m.dosage, m.medication_type, m.color,
         m.instructions, m.category, u.full_name, u.email
  FROM reminders r
  JOIN medications m ON r.medication_id = m.id
  JOIN users u ON r.user_id = u.id
  WHERE r.scheduled_date = CURRENT_DATE;

CREATE VIEW v_adherence_summary AS
  SELECT user_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status='taken') AS taken,
    COUNT(*) FILTER (WHERE status='missed') AS missed,
    ROUND(COUNT(*) FILTER (WHERE status='taken') * 100.0 / NULLIF(COUNT(*),0), 1) AS adherence_pct
  FROM reminders
  WHERE scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id;

-- ================================================================
-- SEED DATA
-- ================================================================
-- Admin: admin@medicare.com / Admin@1234
INSERT INTO users (full_name, email, password_hash, role, is_verified, notify_email)
VALUES ('System Admin', 'admin@medicare.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBzWZx4WtUGMa6', 'admin', true, true);

-- Patient: patient@test.com / Test@1234
INSERT INTO users (full_name, email, password_hash, phone, role, is_verified,
                   medical_conditions, doctor_name)
VALUES ('Sarah Johnson', 'patient@test.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBzWZx4WtUGMa6',
  '+61411111111', 'patient', true,
  ARRAY['Type 2 Diabetes','Hypertension'], 'Dr. Michael Chen');

-- Caregiver: caregiver@test.com / Test@1234
INSERT INTO users (full_name, email, password_hash, phone, role, is_verified)
VALUES ('Mary Johnson', 'caregiver@test.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBzWZx4WtUGMa6',
  '+61422222222', 'caregiver', true);

-- Link caregiver to patient
INSERT INTO caregiver_patients (caregiver_id, patient_id, relationship)
VALUES (3, 2, 'Daughter');

-- Sample medications for patient
INSERT INTO medications (user_id, name, dosage, frequency, times, category,
  medication_type, instructions, start_date, end_date, prescribed_by, current_stock)
VALUES
(2,'Metformin','500mg','Twice daily',ARRAY['08:00','20:00'],'Morning & Evening',
  'tablet','Take with food. Do not crush or chew.',
  CURRENT_DATE - 30, CURRENT_DATE + 60, 'Dr. Michael Chen', 58),
(2,'Amlodipine','5mg','Once daily',ARRAY['08:00'],'Morning',
  'tablet','Take at the same time each day.',
  CURRENT_DATE - 30, CURRENT_DATE + 60, 'Dr. Michael Chen', 28),
(2,'Vitamin D3','1000IU','Once daily',ARRAY['13:00'],'Afternoon',
  'capsule','Take with a meal containing fat for best absorption.',
  CURRENT_DATE - 60, CURRENT_DATE + 90, 'Dr. Michael Chen', 45),
(2,'Atorvastatin','20mg','Once daily',ARRAY['21:00'],'Evening',
  'tablet','Take at bedtime. Avoid grapefruit juice.',
  CURRENT_DATE - 15, CURRENT_DATE + 75, 'Dr. Michael Chen', 15);

-- Generate today's reminders
INSERT INTO reminders (medication_id, user_id, scheduled_time, scheduled_date, status, taken_at)
VALUES
(1, 2, '08:00', CURRENT_DATE, 'taken', NOW() - INTERVAL '4 hours'),
(2, 2, '08:00', CURRENT_DATE, 'taken', NOW() - INTERVAL '4 hours'),
(3, 2, '13:00', CURRENT_DATE, 'missed', NULL),
(4, 2, '21:00', CURRENT_DATE, 'pending', NULL),
(1, 2, '20:00', CURRENT_DATE, 'pending', NULL);

-- Sample adherence records
INSERT INTO adherence_records (reminder_id, user_id, medication_id, action, late_by_minutes)
VALUES (1, 2, 1, 'taken', 5), (2, 2, 2, 'taken', 0), (3, 2, 3, 'missed', NULL);

COMMIT;
