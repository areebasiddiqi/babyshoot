-- Add astria_url column to generated_images table to keep reference to original Astria URLs
ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS astria_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN generated_images.astria_url IS 'Original Astria URL before downloading to Supabase Storage';

-- Create index for potential queries
CREATE INDEX IF NOT EXISTS idx_generated_images_astria_url ON generated_images(astria_url);

-- Update existing records to move current image_url to astria_url if they are Astria URLs
UPDATE generated_images 
SET astria_url = image_url 
WHERE image_url LIKE '%astria%' 
AND astria_url IS NULL;
