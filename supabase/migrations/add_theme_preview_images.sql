-- Add preview_images column to themes table
ALTER TABLE themes ADD COLUMN IF NOT EXISTS preview_images TEXT[];

-- Add some sample preview images for existing themes
UPDATE themes SET preview_images = ARRAY[
  'https://your-cdn.com/theme-previews/' || id || '/preview-1.jpg',
  'https://your-cdn.com/theme-previews/' || id || '/preview-2.jpg',
  'https://your-cdn.com/theme-previews/' || id || '/preview-3.jpg',
  'https://your-cdn.com/theme-previews/' || id || '/preview-4.jpg',
  'https://your-cdn.com/theme-previews/' || id || '/preview-5.jpg'
] WHERE preview_images IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_themes_preview_images ON themes USING GIN (preview_images);
