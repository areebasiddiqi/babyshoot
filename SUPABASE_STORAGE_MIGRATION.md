# Supabase Storage Migration Guide

This guide will help you migrate from storing Astria URLs directly to downloading and storing images in Supabase Storage.

## 🎯 What This Changes

**Before**: Images stored as Astria URLs (e.g., `https://sdbooth2-production.s3.amazonaws.com/...`)
**After**: Images downloaded and stored in Supabase Storage (e.g., `https://your-project.supabase.co/storage/v1/object/public/generated-images/...`)

## 📋 Setup Steps

### 1. Run Database Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Add astria_url column to keep reference to original URLs
ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS astria_url TEXT;

-- Add comment and index
COMMENT ON COLUMN generated_images.astria_url IS 'Original Astria URL before downloading to Supabase Storage';
CREATE INDEX IF NOT EXISTS idx_generated_images_astria_url ON generated_images(astria_url);

-- Migrate existing Astria URLs to astria_url column
UPDATE generated_images 
SET astria_url = image_url 
WHERE image_url LIKE '%astria%' 
AND astria_url IS NULL;
```

### 2. Create Storage Bucket

In your **Supabase Dashboard**:

1. Go to **Storage** → **Buckets**
2. Click **"New bucket"**
3. Settings:
   - **Name**: `generated-images`
   - **Public**: ✅ Enabled
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### 3. Setup Storage Policies

Execute this SQL for proper access control:

```sql
-- Allow authenticated users to view images
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'generated-images');

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Allow service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'generated-images');

-- Allow users to view their own session images
CREATE POLICY IF NOT EXISTS "Allow users to view their session images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-images' 
  AND (storage.foldername(name))[1] = 'sessions'
  AND EXISTS (
    SELECT 1 FROM photoshoot_sessions 
    WHERE id::text = (storage.foldername(name))[2]
    AND user_id = auth.uid()
  )
);

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generated-images');

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## 🔄 How It Works

### Image Processing Flow

1. **Astria generates image** → Returns URL like `https://sdbooth2-production.s3.amazonaws.com/...`
2. **Auto-update detects completion** → Downloads image from Astria URL
3. **Uploads to Supabase Storage** → Path: `sessions/{sessionId}/{imageId}.jpg`
4. **Updates database**:
   - `image_url` = Supabase Storage URL (for display)
   - `astria_url` = Original Astria URL (for reference)

### File Organization

```
generated-images/
└── sessions/
    ├── session-uuid-1/
    │   ├── image-uuid-1.jpg
    │   ├── image-uuid-2.jpg
    │   └── image-uuid-3.jpg
    └── session-uuid-2/
        ├── image-uuid-4.jpg
        └── image-uuid-5.jpg
```

## ✅ Benefits

- **Reliability**: Images stored in your own infrastructure
- **Performance**: Faster loading from Supabase CDN
- **Control**: Full control over image lifecycle
- **Backup**: Original Astria URLs preserved in `astria_url` column
- **Security**: Proper access control with RLS policies

## 🧪 Testing

1. **Create a new photoshoot** and wait for images to generate
2. **Check the auto-update logs** for download/upload messages:
   ```
   📥 Processing image [id] from Astria URL: https://...
   📤 Uploading to Supabase Storage: sessions/[sessionId]/[imageId].jpg
   ✅ Image [id] stored in Supabase Storage: https://...
   ```
3. **Verify in Supabase Dashboard** → Storage → generated-images
4. **Check database** that `image_url` contains Supabase URLs

## 🔧 Troubleshooting

### Bucket Creation Issues
- Ensure you have proper permissions in Supabase Dashboard
- Check that bucket name is exactly `generated-images`
- Verify public access is enabled

### Upload Failures
- Check Supabase service role key is correct
- Verify file size limits (10MB default)
- Check network connectivity for image downloads

### RLS Policy Issues
- Ensure policies are created correctly
- Test with different user roles
- Check storage.objects table has RLS enabled

## 🔄 Rollback Plan

If you need to rollback:

1. **Restore original URLs**:
   ```sql
   UPDATE generated_images 
   SET image_url = astria_url 
   WHERE astria_url IS NOT NULL;
   ```

2. **Remove storage column**:
   ```sql
   ALTER TABLE generated_images DROP COLUMN astria_url;
   ```

## 📊 Monitoring

- **Storage Usage**: Monitor in Supabase Dashboard → Settings → Usage
- **Auto-update Logs**: Check console logs for download/upload status
- **Failed Downloads**: Images will fallback to Astria URLs if storage fails

## 🚀 Production Considerations

- **Storage Costs**: Monitor Supabase storage usage and costs
- **CDN Performance**: Supabase provides global CDN for faster image loading
- **Backup Strategy**: Consider backing up the storage bucket
- **Cleanup**: Implement cleanup for old/unused images if needed
