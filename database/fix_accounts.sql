-- ================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Fixes all account passwords and adds real admin
-- ================================================================

-- Fix password for ALL existing accounts to work with bcrypt
-- Password: 12345678
UPDATE users SET 
  password_hash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email IN ('admin@medicare.com', 'patient@test.com', 'caregiver@test.com');

-- Add your real admin account (password: 12345678)
INSERT INTO users (full_name, email, password_hash, role, is_verified, notify_email)
VALUES ('Gaurab Bhusal', 'gaurabbhusal7@gmail.com',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin', true, true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  role = 'admin',
  is_verified = true;

-- Verify accounts
SELECT id, full_name, email, role, is_active FROM users;
