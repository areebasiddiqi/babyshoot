-- Fix the category constraint to include new family theme categories
-- Run this in Supabase SQL Editor BEFORE adding family themes

-- Drop the old constraint
ALTER TABLE themes DROP CONSTRAINT IF EXISTS themes_category_check;

-- Add the new constraint with all categories
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

-- Verify the constraint was updated
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'themes_category_check';
