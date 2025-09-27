# Family Sessions Migration Guide

This guide will help you apply the database changes needed to support family photoshoot sessions.

## 🚀 Quick Setup (Recommended)

### Step 1: Apply Database Migration
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `scripts/apply-migration.sql`
5. Click **Run** to execute the migration

### Step 2: Add Family Themes
```bash
cd scripts
node add-family-themes.js
```

### Step 3: Update Universal Themes
```bash
node update-universal-themes.js
```

## 📋 What the Migration Does

### Database Schema Changes:

1. **Themes Table Updates:**
   - ✅ Adds `session_type` column (`'child'`, `'family'`, `'both'`)
   - ✅ Expands category options for family themes
   - ✅ Updates existing themes to support both session types where appropriate

2. **Photoshoot Sessions Table Updates:**
   - ✅ Makes `child_id` nullable (for family sessions)
   - ✅ Adds `family_fingerprint` column for family model reuse
   - ✅ Adds constraint to ensure either child_id OR family_fingerprint is set

3. **Performance Indexes:**
   - ✅ Adds indexes for family fingerprint queries
   - ✅ Adds indexes for theme filtering by session type

### New Themes Added:
- **Holiday Magic**: Festive family moments
- **Beach Vacation**: Relaxed family beach portraits  
- **Formal Family Portrait**: Classic elegant portraits
- **Casual Home Life**: Natural family moments
- **Garden Party**: Elegant outdoor gathering
- **Autumn Harvest**: Fall colors and seasonal elements
- **Sports Family**: Active family portraits
- **Vintage Classic**: Timeless vintage styling
- **Adventure Family**: Outdoor adventure portraits
- **Cozy Winter**: Warm indoor winter portraits

## 🔍 Verification

After running the migration, verify it worked:

```sql
-- Check themes have session_type column
SELECT COUNT(*) as total_themes, session_type 
FROM themes 
GROUP BY session_type;

-- Check photoshoot_sessions has family_fingerprint
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'photoshoot_sessions' 
AND column_name = 'family_fingerprint';

-- Check constraint exists
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'photoshoot_sessions' 
AND constraint_name = 'session_type_check';
```

Expected results:
- Themes should show counts for 'child', 'family', and 'both' session types
- family_fingerprint column should exist and be nullable
- session_type_check constraint should exist

## 🛠️ Manual Steps (If Needed)

If the automatic migration fails, you can run these commands manually in Supabase SQL Editor:

```sql
-- 1. Add session_type to themes
ALTER TABLE themes ADD COLUMN session_type TEXT DEFAULT 'child';
ALTER TABLE themes ADD CONSTRAINT themes_session_type_check 
CHECK (session_type IN ('child', 'family', 'both'));

-- 2. Add family support to sessions
ALTER TABLE photoshoot_sessions ADD COLUMN family_fingerprint TEXT;
ALTER TABLE photoshoot_sessions ALTER COLUMN child_id DROP NOT NULL;

-- 3. Add session type constraint
ALTER TABLE photoshoot_sessions ADD CONSTRAINT session_type_check CHECK (
  (child_id IS NOT NULL AND family_fingerprint IS NULL) OR 
  (child_id IS NULL AND family_fingerprint IS NOT NULL)
);

-- 4. Create indexes
CREATE INDEX idx_sessions_family_fingerprint ON photoshoot_sessions(family_fingerprint);
CREATE INDEX idx_themes_session_type ON themes(session_type);
```

## 🎯 Testing

After migration, test the family session flow:

1. **Create Family Session:**
   - Go to `/create`
   - Select "Family Photoshoot"
   - Add multiple family members
   - Upload photos
   - Select a family theme
   - Create session

2. **Verify Model Reuse:**
   - Create another family session with same family composition
   - Should see "Model Reused" indicator
   - Session should be immediately ready

3. **Check Theme Filtering:**
   - Child sessions should show child + universal themes
   - Family sessions should show family + universal themes

## 🚨 Troubleshooting

**Error: "session_type column doesn't exist"**
- Run the migration SQL manually in Supabase dashboard

**Error: "constraint violation"**
- Check that existing sessions have child_id set
- Ensure new family sessions have family_fingerprint set

**Themes not filtering correctly**
- Verify session_type column has correct values
- Check API is passing sessionType parameter

**Family model reuse not working**
- Verify family_fingerprint column exists
- Check family fingerprint generation logic
- Ensure indexes are created

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database schema in Supabase dashboard
3. Test API endpoints with curl/Postman
4. Check server logs for detailed error messages

The migration adds full family session support while maintaining backward compatibility with existing child sessions.
