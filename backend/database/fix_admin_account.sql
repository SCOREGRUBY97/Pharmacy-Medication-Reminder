-- RUN THIS IN SUPABASE SQL EDITOR
-- Creates/fixes admin login: gaurabbhusal7@gmail.com / 12345678

INSERT INTO users (full_name, email, password_hash, role, is_verified, notify_email, is_active)
VALUES (
  'Gaurab Bhusal',
  'gaurabbhusal7@gmail.com',
  '$2a$12$4l3qctzIydJMyUh3QSE7MOSKHEcDyU7MyOZq8dLpduDv8wUvrOCoy',
  'admin',
  true,
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$12$4l3qctzIydJMyUh3QSE7MOSKHEcDyU7MyOZq8dLpduDv8wUvrOCoy',
  role = 'admin',
  is_verified = true,
  is_active = true,
  updated_at = NOW();

SELECT id, full_name, email, role, is_active FROM users WHERE email = 'gaurabbhusal7@gmail.com';
