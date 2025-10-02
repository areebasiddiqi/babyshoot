-- Add family_fingerprint column to photoshoot_sessions table
-- Run this in Supabase SQL Editor

-- Step 1: Add the family_fingerprint column
ALTER TABLE photoshoot_sessions ADD COLUMN IF NOT EXISTS family_fingerprint TEXT;

-- Step 2: Make child_id nullable (for family sessions)
ALTER TABLE photoshoot_sessions ALTER COLUMN child_id DROP NOT NULL;

-- Step 3: Add constraint to ensure either child_id OR family_fingerprint is set
ALTER TABLE photoshoot_sessions DROP CONSTRAINT IF EXISTS session_type_check;
ALTER TABLE photoshoot_sessions ADD CONSTRAINT session_type_check CHECK (
  (child_id IS NOT NULL AND family_fingerprint IS NULL) OR 
  (child_id IS NULL AND family_fingerprint IS NOT NULL)
);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_family_fingerprint ON photoshoot_sessions(family_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sessions_user_family_fingerprint ON photoshoot_sessions(user_id, family_fingerprint);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN photoshoot_sessions.family_fingerprint IS 'Fingerprint for family composition matching for model reuse';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'photoshoot_sessions' 
AND column_name IN ('child_id', 'family_fingerprint')
ORDER BY column_name;
