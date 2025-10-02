-- Setup Supabase Storage for generated images
-- 
-- IMPORTANT: This script cannot be run directly in the SQL Editor
-- Storage policies must be created via the Supabase Dashboard
--
-- Follow these steps instead:

-- 1. CREATE STORAGE BUCKET via Supabase Dashboard:
--    - Go to Storage → Buckets
--    - Click "New bucket"
--    - Name: generated-images
--    - Public: ✅ Enabled
--    - File size limit: 10 MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp

-- 2. CREATE STORAGE POLICIES via Supabase Dashboard:
--    - Go to Storage → Buckets → generated-images → Policies
--    - Create these policies:

-- Policy 1: "Allow service role full access"
-- Type: All operations
-- Target roles: service_role
-- Policy definition: bucket_id = 'generated-images'

-- Policy 2: "Allow public read access"  
-- Type: SELECT
-- Target roles: public
-- Policy definition: bucket_id = 'generated-images'

-- Alternative: If you have supabase CLI, you can create the bucket programmatically:
-- supabase storage create-bucket generated-images --public

-- The storage bucket will be automatically configured for public read access
-- and the service role will have full management permissions.
