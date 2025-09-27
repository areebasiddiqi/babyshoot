-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Children profiles
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_in_months INTEGER NOT NULL CHECK (age_in_months >= 0 AND age_in_months <= 120),
  gender TEXT NOT NULL CHECK (gender IN ('boy', 'girl', 'other')),
  hair_color TEXT NOT NULL,
  hair_style TEXT NOT NULL,
  eye_color TEXT NOT NULL,
  skin_tone TEXT NOT NULL,
  unique_features TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Themes
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('newborn', 'toddler', 'family', 'seasonal', 'fantasy', 'holiday', 'outdoor', 'formal', 'lifestyle', 'sports', 'vintage', 'adventure')),
  session_type TEXT NOT NULL DEFAULT 'child' CHECK (session_type IN ('child', 'family', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photoshoot sessions
CREATE TABLE photoshoot_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE, -- Made nullable for family sessions
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'training', 'ready', 'generating', 'completed', 'failed')),
  model_id TEXT,
  training_job_id TEXT,
  generation_job_id TEXT,
  generation_prompt TEXT,
  uploaded_photos TEXT[] DEFAULT '{}',
  selected_theme_id UUID REFERENCES themes(id),
  base_prompt TEXT,
  enhanced_prompt TEXT,
  family_fingerprint TEXT, -- For family session model reuse
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint: either child_id OR family_fingerprint must be set
  CONSTRAINT session_type_check CHECK (
    (child_id IS NOT NULL AND family_fingerprint IS NULL) OR 
    (child_id IS NULL AND family_fingerprint IS NOT NULL)
  )
);

-- Generated images
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES photoshoot_sessions(id) ON DELETE CASCADE,
  image_url TEXT DEFAULT '',
  thumbnail_url TEXT,
  prompt TEXT NOT NULL,
  seed INTEGER,
  astria_prompt_id TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  photoshoots_used INTEGER DEFAULT 0,
  photoshoots_limit INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default themes
INSERT INTO themes (name, description, prompt, category, session_type, thumbnail_url) VALUES
('Newborn in Bloom', 'Soft florals and pastels perfect for newborns', 'surrounded by delicate flowers, soft pastel colors, dreamy floral background, gentle spring vibes', 'newborn', 'child', '/themes/bloom.jpg'),
('Superhero Adventure', 'Heroic poses and colorful capes', 'wearing a colorful superhero cape, heroic pose, bright colors, adventure theme, playful superhero setting', 'fantasy', 'both', '/themes/superhero.jpg'),
('Beach Day', 'Sandy shores and sunshine vibes', 'on a beautiful beach, sandy background, ocean waves, sunny day, tropical paradise, summer vibes', 'outdoor', 'both', '/themes/beach.jpg'),
('Holiday Magic', 'Festive and cozy winter wonderland', 'in a magical winter wonderland, snow, festive decorations, cozy holiday atmosphere, warm lighting', 'holiday', 'both', '/themes/holiday.jpg'),
('Garden Party', 'Whimsical garden setting with butterflies', 'in a magical garden, butterflies, colorful flowers, enchanted forest, fairy tale setting', 'outdoor', 'both', '/themes/garden.jpg'),
('Cozy Nursery', 'Soft and warm nursery environment', 'in a cozy nursery, soft blankets, warm lighting, peaceful atmosphere, comfort and love', 'newborn', 'child', '/themes/nursery.jpg'),
('Safari Adventure', 'Wild safari with friendly animals', 'on a safari adventure, friendly animals, jungle setting, explorer theme, adventure and discovery', 'adventure', 'both', '/themes/safari.jpg'),
('Starry Night', 'Dreamy nighttime with stars and moon', 'under a starry night sky, crescent moon, twinkling stars, dreamy atmosphere, magical night', 'fantasy', 'both', '/themes/starry.jpg');

-- Create indexes for better performance
CREATE INDEX idx_children_user_id ON children(user_id);
CREATE INDEX idx_sessions_user_id ON photoshoot_sessions(user_id);
CREATE INDEX idx_sessions_child_id ON photoshoot_sessions(child_id);
CREATE INDEX idx_sessions_status ON photoshoot_sessions(status);
CREATE INDEX idx_sessions_family_fingerprint ON photoshoot_sessions(family_fingerprint);
CREATE INDEX idx_sessions_user_family_fingerprint ON photoshoot_sessions(user_id, family_fingerprint);
CREATE INDEX idx_images_session_id ON generated_images(session_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_themes_session_type ON themes(session_type);
CREATE INDEX idx_themes_active_session_type ON themes(is_active, session_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON photoshoot_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE photoshoot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

-- Children policies
CREATE POLICY "Users can view own children" ON children FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own children" ON children FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own children" ON children FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own children" ON children FOR DELETE USING (auth.uid()::text = user_id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON photoshoot_sessions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own sessions" ON photoshoot_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own sessions" ON photoshoot_sessions FOR UPDATE USING (auth.uid()::text = user_id);

-- Images policies
CREATE POLICY "Users can view images from own sessions" ON generated_images FOR SELECT 
USING (EXISTS (SELECT 1 FROM photoshoot_sessions WHERE id = session_id AND user_id = auth.uid()::text));

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE USING (auth.uid()::text = user_id);

-- Themes are public
CREATE POLICY "Anyone can view themes" ON themes FOR SELECT USING (is_active = true);
