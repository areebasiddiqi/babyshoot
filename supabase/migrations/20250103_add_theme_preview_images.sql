-- Add preview_images column to themes table
-- This will store an array of image URLs for theme previews

ALTER TABLE themes 
ADD COLUMN IF NOT EXISTS preview_images TEXT[] DEFAULT '{}';

-- Update existing themes to have empty array instead of NULL
UPDATE themes 
SET preview_images = '{}' 
WHERE preview_images IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN themes.preview_images IS 'Array of image URLs for theme preview gallery';

-- Create index for better performance when querying themes with preview images
CREATE INDEX IF NOT EXISTS idx_themes_preview_images ON themes USING GIN (preview_images);

-- Verify the migration
SELECT 'Theme preview images column added successfully!' as status;
