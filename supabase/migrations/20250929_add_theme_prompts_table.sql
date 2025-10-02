-- Migration: Add theme_prompts table for configurable individual image prompts
-- This allows each theme to have multiple unique prompts for generating varied images

-- Create theme_prompts table
CREATE TABLE theme_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  prompt_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate order within same theme
ALTER TABLE theme_prompts ADD CONSTRAINT theme_prompts_unique_order 
UNIQUE (theme_id, prompt_order);

-- Add configurable image count to themes table
ALTER TABLE themes ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 10 
CHECK (image_count >= 1 AND image_count <= 20);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_theme_prompts_theme_id ON theme_prompts(theme_id);
CREATE INDEX IF NOT EXISTS idx_theme_prompts_active_order ON theme_prompts(theme_id, is_active, prompt_order);

-- Add updated_at trigger for theme_prompts
CREATE OR REPLACE FUNCTION update_theme_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER theme_prompts_updated_at
  BEFORE UPDATE ON theme_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_prompts_updated_at();

-- Add comments to document the tables
COMMENT ON TABLE theme_prompts IS 'Individual prompts for each theme to generate unique images';
COMMENT ON COLUMN theme_prompts.prompt_text IS 'The specific prompt text for generating this image variation';
COMMENT ON COLUMN theme_prompts.prompt_order IS 'Order of this prompt within the theme (1-based)';
COMMENT ON COLUMN themes.image_count IS 'Number of images to generate for this theme (1-20)';

-- Update existing themes to have default image count
UPDATE themes SET image_count = 10 WHERE image_count IS NULL;

-- Add theme_prompt_id to generated_images table to link each image to its specific prompt
ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS theme_prompt_id UUID 
REFERENCES theme_prompts(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_generated_images_theme_prompt ON generated_images(theme_prompt_id);

-- Add comment to document the new column
COMMENT ON COLUMN generated_images.theme_prompt_id IS 'Links the generated image to the specific theme prompt used';
