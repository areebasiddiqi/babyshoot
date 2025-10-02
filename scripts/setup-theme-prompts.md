# Setup Theme Prompts System

This guide explains how to set up the new configurable theme prompts system.

## 1. Run Database Migration

First, apply the database migration to create the new tables:

```bash
# Apply the migration (this should be done through your Supabase dashboard or CLI)
# The migration file is: supabase/migrations/20250929_add_theme_prompts_table.sql
```

## 2. Populate Default Prompts

Run the script to populate existing themes with default prompts:

```bash
node scripts/populate-default-theme-prompts.js
```

## 3. Verify Setup

1. Check that the `theme_prompts` table was created
2. Verify that existing themes now have `image_count` set to 10
3. Confirm that theme prompts were populated for existing themes
4. Test the admin interface at `/admin/themes` - you should see gear icons for managing prompts

## Database Schema Changes

### New Tables
- `theme_prompts`: Stores individual prompts for each theme
  - `id`: UUID primary key
  - `theme_id`: References themes table
  - `prompt_text`: The specific prompt for this image variation
  - `prompt_order`: Order of the prompt (1-based)
  - `is_active`: Whether this prompt is active

### Updated Tables
- `themes`: Added `image_count` column (1-20, default 10)
- `generated_images`: Added `theme_prompt_id` to link images to specific prompts

## How It Works

1. **Theme Configuration**: Super admins can set how many images each theme generates (1-20)
2. **Individual Prompts**: Each theme can have multiple unique prompts for varied image generation
3. **Image Generation**: When generating images, the system uses individual prompts instead of repeating the same prompt
4. **Backward Compatibility**: Themes without prompts fall back to single image generation

## Admin Interface

- Navigate to `/admin/themes`
- Click the gear icon next to any theme to manage its prompts
- Add, edit, delete, and reorder prompts
- Configure image count per theme
- Toggle prompt active/inactive status

## Benefits

- **Unique Images**: Each generated image uses a different prompt for variety
- **Configurable Count**: Themes can generate 1-20 images as needed
- **Super Admin Control**: Full control over prompt content and ordering
- **Better User Experience**: More diverse and interesting generated images
