-- Migration: Add session_type column to themes table
-- This allows themes to be categorized for child, family, or both session types

-- Add session_type column to themes table
ALTER TABLE themes ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'child';

-- Add check constraint to ensure valid session types
ALTER TABLE themes ADD CONSTRAINT themes_session_type_check 
CHECK (session_type IN ('child', 'family', 'both'));

-- Update existing themes to have proper session_type values
-- Set popular fantasy/adventure themes to work for both child and family
UPDATE themes 
SET session_type = 'both' 
WHERE name IN (
  'Magical Forest',
  'Princess Dreams', 
  'Superhero Adventure',
  'Fairy Tale',
  'Space Explorer',
  'Pirate Adventure',
  'Safari Adventure',
  'Under the Sea',
  'Rainbow Dreams',
  'Enchanted Garden'
) AND session_type = 'child';

-- Ensure all other existing themes are marked as child-only
UPDATE themes 
SET session_type = 'child' 
WHERE session_type IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_themes_session_type ON themes(session_type);

-- Add index for filtering active themes by session type
CREATE INDEX IF NOT EXISTS idx_themes_active_session_type ON themes(is_active, session_type);

-- Add comment to document the column
COMMENT ON COLUMN themes.session_type IS 'Determines which session types can use this theme: child, family, or both';
