-- Create app configuration tables for super admin settings

-- Create app_config table for global application settings
CREATE TABLE IF NOT EXISTS app_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(config_key);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON app_config(category);
CREATE INDEX IF NOT EXISTS idx_app_config_active ON app_config(is_active);

-- Insert default photoshoot configuration
INSERT INTO app_config (config_key, config_value, description, category) VALUES
('photoshoot_options', 
 '{
   "child_photoshoot_enabled": true,
   "family_photoshoot_enabled": true,
   "default_session_type": "child",
   "require_session_type_selection": true
 }', 
 'Controls which photoshoot types are available to users',
 'photoshoot'),

('profile_form_config',
 '{
   "child_profile_fields": {
     "name": {"required": true, "enabled": true},
     "age_in_months": {"required": true, "enabled": true},
     "gender": {"required": false, "enabled": true},
     "hair_color": {"required": false, "enabled": true},
     "hair_style": {"required": false, "enabled": true},
     "eye_color": {"required": false, "enabled": true},
     "skin_tone": {"required": false, "enabled": true},
     "unique_features": {"required": false, "enabled": true}
   },
   "family_profile_fields": {
     "member_name": {"required": true, "enabled": true},
     "age": {"required": true, "enabled": true},
     "gender": {"required": true, "enabled": true},
     "relation": {"required": true, "enabled": true}
   }
 }',
 'Controls which fields are shown and required in profile forms',
 'profile'),

('profile_field_options',
 '{
   "hair_colors": [
     "Blonde", "Brown", "Black", "Red", "Auburn", "Gray", "White", 
     "Strawberry Blonde", "Dirty Blonde", "Light Brown", "Dark Brown", 
     "Chestnut", "Copper", "Silver", "Salt and Pepper"
   ],
   "hair_styles": [
     "Straight", "Wavy", "Curly", "Coily", "Short", "Medium", "Long",
     "Pixie Cut", "Bob", "Ponytail", "Braids", "Bun", "Loose", "Tight Curls"
   ],
   "eye_colors": [
     "Brown", "Blue", "Green", "Hazel", "Gray", "Amber", "Black",
     "Light Brown", "Dark Brown", "Blue-Green", "Blue-Gray", "Green-Gray"
   ],
   "skin_tones": [
     "Fair", "Light", "Medium", "Olive", "Tan", "Dark", "Deep",
     "Porcelain", "Ivory", "Beige", "Golden", "Bronze", "Ebony"
   ],
   "genders": [
     "Boy", "Girl", "Other"
   ],
   "relations": [
     "Parent", "Child", "Grandparent", "Grandchild", "Sibling", 
     "Spouse", "Partner", "Uncle", "Aunt", "Cousin", "Other"
   ]
 }',
 'Dropdown options for profile form fields',
 'profile'),

('ui_customization',
 '{
   "show_session_type_icons": true,
   "session_type_descriptions": {
     "child": "Perfect for capturing your child''s personality and milestones",
     "family": "Beautiful portraits of your entire family together"
   },
   "default_theme_categories": ["child", "family", "both"]
 }',
 'UI customization settings for photoshoot creation',
 'ui')

ON CONFLICT (config_key) DO NOTHING;

-- Ensure users table has role column (if not already exists)
-- This assumes you have a users table that mirrors auth.users with additional fields
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_config
CREATE POLICY "Super admins can manage app config"
ON app_config FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id::uuid = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "All users can read active config"
ON app_config FOR SELECT
TO authenticated
USING (is_active = true);

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id::uuid = user_uuid 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get app config
CREATE OR REPLACE FUNCTION get_app_config(config_key_param TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  IF config_key_param IS NULL THEN
    -- Return all active config as a single JSON object
    SELECT jsonb_object_agg(config_key, config_value)
    INTO result
    FROM app_config
    WHERE is_active = true;
  ELSE
    -- Return specific config value
    SELECT config_value
    INTO result
    FROM app_config
    WHERE config_key = config_key_param
    AND is_active = true;
  END IF;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
