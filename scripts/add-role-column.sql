-- Add role column to users table for super admin functionality

-- Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comment to explain the column
COMMENT ON COLUMN users.role IS 'User role: user, admin, super_admin';

-- Update any existing admin users (optional - adjust as needed)
-- UPDATE users SET role = 'admin' WHERE email IN ('admin@example.com');
-- UPDATE users SET role = 'super_admin' WHERE email IN ('superadmin@example.com');

-- Show current role distribution
SELECT 
  role,
  COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;
