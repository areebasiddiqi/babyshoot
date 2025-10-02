-- Apply migration to add family session support
-- Run this in your Supabase SQL Editor

-- Step 1: Add session_type column to themes table
ALTER TABLE themes ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'child';

-- Step 2: Add check constraint for session_type
ALTER TABLE themes ADD CONSTRAINT IF NOT EXISTS themes_session_type_check 
CHECK (session_type IN ('child', 'family', 'both'));

-- Step 3: Update category constraint to include new categories
ALTER TABLE themes DROP CONSTRAINT IF EXISTS themes_category_check;
ALTER TABLE themes ADD CONSTRAINT themes_category_check 
CHECK (category IN (
  'newborn', 
  'toddler', 
  'family', 
  'seasonal', 
  'fantasy', 
  'holiday', 
  'outdoor', 
  'formal', 
  'lifestyle', 
  'sports', 
  'vintage', 
  'adventure'
));

-- Step 4: Add family_fingerprint column to photoshoot_sessions
ALTER TABLE photoshoot_sessions ADD COLUMN IF NOT EXISTS family_fingerprint TEXT;

-- Step 5: Make child_id nullable for family sessions
ALTER TABLE photoshoot_sessions ALTER COLUMN child_id DROP NOT NULL;

-- Step 6: Add constraint to ensure either child_id OR family_fingerprint is set
ALTER TABLE photoshoot_sessions DROP CONSTRAINT IF EXISTS session_type_check;
ALTER TABLE photoshoot_sessions ADD CONSTRAINT session_type_check CHECK (
  (child_id IS NOT NULL AND family_fingerprint IS NULL) OR 
  (child_id IS NULL AND family_fingerprint IS NOT NULL)
);

-- Step 7: Update existing themes to have proper session_type values
UPDATE themes 
SET session_type = 'both' 
WHERE name IN (
  'Superhero Adventure',
  'Beach Day', 
  'Holiday Magic',
  'Garden Party',
  'Safari Adventure',
  'Starry Night'
) AND session_type = 'child';

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_family_fingerprint ON photoshoot_sessions(family_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sessions_user_family_fingerprint ON photoshoot_sessions(user_id, family_fingerprint);
CREATE INDEX IF NOT EXISTS idx_themes_session_type ON themes(session_type);
CREATE INDEX IF NOT EXISTS idx_themes_active_session_type ON themes(is_active, session_type);

-- Step 9: Add comments for documentation
COMMENT ON COLUMN themes.session_type IS 'Determines which session types can use this theme: child, family, or both';
COMMENT ON COLUMN photoshoot_sessions.family_fingerprint IS 'Fingerprint for family composition matching for model reuse';

-- Verification queries (run these to check the migration worked)
-- SELECT COUNT(*) as total_themes, session_type FROM themes GROUP BY session_type;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'themes' AND column_name = 'session_type';
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'photoshoot_sessions' AND column_name = 'family_fingerprint';
