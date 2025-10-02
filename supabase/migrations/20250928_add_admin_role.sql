-- Add admin role to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create index for role queries
CREATE INDEX idx_users_role ON users(role);

-- Update RLS policies to allow admins to manage themes
CREATE POLICY "Admins can manage themes" ON themes 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow admins to view all users (for admin dashboard)
CREATE POLICY "Admins can view all users" ON users 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow admins to view all sessions (for admin dashboard)
CREATE POLICY "Admins can view all sessions" ON photoshoot_sessions 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow admins to view all images (for admin dashboard)
CREATE POLICY "Admins can view all images" ON generated_images 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'super_admin')
  )
);
