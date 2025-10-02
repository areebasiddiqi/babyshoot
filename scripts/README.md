# Theme Management Scripts

This directory contains scripts to manage themes for both child and family photoshoot sessions.

## Setup

1. Make sure you have Node.js installed
2. Install dependencies: `npm install @supabase/supabase-js dotenv`
3. Ensure your `.env.local` file has the required Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Scripts

### add-family-themes.js
Adds 10 family-specific themes to the database:

- **Holiday Magic**: Festive family moments with holiday decorations
- **Beach Vacation**: Relaxed family beach portraits
- **Formal Family Portrait**: Classic elegant family portraits
- **Casual Home Life**: Natural family moments at home
- **Garden Party**: Elegant outdoor family gathering
- **Autumn Harvest**: Warm family portraits with fall colors
- **Sports Family**: Active family portraits with sports theme
- **Vintage Classic**: Timeless family portraits with vintage styling
- **Adventure Family**: Outdoor adventure family portraits
- **Cozy Winter**: Warm indoor family portraits

**Usage:**
```bash
cd scripts
node add-family-themes.js
```

### update-universal-themes.js
Updates existing child themes that work well for families to support both session types:

- Magical Forest
- Princess Dreams
- Superhero Adventure
- Fairy Tale
- Space Explorer
- Pirate Adventure
- Safari Adventure
- Under the Sea
- Rainbow Dreams
- Enchanted Garden

**Usage:**
```bash
cd scripts
node update-universal-themes.js
```

## Database Schema

The themes table should have a `session_type` column with possible values:
- `'child'`: Only for child sessions
- `'family'`: Only for family sessions  
- `'both'`: For both child and family sessions

## Theme Categories

### Family-Specific Categories:
- **Holiday**: Seasonal celebrations and festivities
- **Outdoor**: Natural settings and outdoor activities
- **Formal**: Elegant and sophisticated portraits
- **Lifestyle**: Casual, everyday family moments
- **Seasonal**: Season-specific themes (autumn, winter, etc.)
- **Sports**: Active and athletic family themes
- **Vintage**: Classic and retro styling
- **Adventure**: Outdoor exploration and adventure

### Universal Categories (Child + Family):
- **Fantasy**: Magical and imaginative themes
- **Adventure**: Exploration and discovery
- **Nature**: Natural settings and wildlife
- **Fairy Tale**: Classic story themes

## Running the Scripts

1. **First time setup**: Run both scripts to populate family themes and update universal themes
   ```bash
   node add-family-themes.js
   node update-universal-themes.js
   ```

2. **Adding new themes**: Modify the theme arrays in the scripts and run them again

3. **Verification**: Check your Supabase dashboard to confirm themes were added correctly

## API Integration

The themes API (`/api/themes`) now supports filtering by session type:
- `/api/themes?sessionType=child` - Returns child and universal themes
- `/api/themes?sessionType=family` - Returns family and universal themes
- `/api/themes` - Defaults to child themes

## UI Integration

The create page automatically:
- Fetches appropriate themes based on selected session type
- Shows different descriptions for child vs family themes
- Resets theme selection when session type changes
- Displays session-appropriate messaging
