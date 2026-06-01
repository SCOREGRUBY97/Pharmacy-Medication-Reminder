-- Run this in Supabase SQL Editor to fix admin login
-- Password for ALL accounts: Test@1234

UPDATE users SET 
  password_hash = 'b$10$eRYtitpUdAsAIx6kothMmOBeU7mtxS6EcobTa/ghbj9cAW222itna',
  is_active = true,
  is_verified = true
WHERE email IN ('admin@medicare.com', 'patient@test.com', 'caregiver@test.com', 'gaurabbhusal7@gmail.com');

INSERT INTO users (full_name, email, password_hash, role, is_active, is_verified)
VALUES ('Gaurab Bhusal', 'gaurabbhusal7@gmail.com', 'b$10$eRYtitpUdAsAIx6kothMmOBeU7mtxS6EcobTa/ghbj9cAW222itna', 'admin', true, true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = 'b$10$eRYtitpUdAsAIx6kothMmOBeU7mtxS6EcobTa/ghbj9cAW222itna',
  role = 'admin',
  is_active = true,
  is_verified = true;

SELECT email, role, is_active FROM users;
