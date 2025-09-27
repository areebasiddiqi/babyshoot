// Script to add family-specific themes to the database
// Run with: node scripts/add-family-themes.js

const { createClient } = require('@supabase/supabase-js')

// Use your Supabase credentials
const supabase = createClient(
  "https://wuhwvnkquzhvdztrmqoo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHd2bmtxdXpodmR6dHJtcW9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2MDcyNCwiZXhwIjoyMDc0NDM2NzI0fQ.z_rev9VLzzLR_k4kvpkvq_U9k08LbMG2RFIdiA_qtPE"
)

const familyThemes = [
  {
    name: "Holiday Magic",
    description: "Festive family moments with holiday decorations and warm lighting",
    prompt: "Professional family holiday portrait, festive decorations, warm golden lighting, cozy winter atmosphere, Christmas tree background, elegant holiday outfits, joyful expressions, family gathered together",
    category: "Holiday",
    session_type: "family",
    is_active: true
  },
  {
    name: "Beach Vacation",
    description: "Relaxed family beach portraits with ocean backdrop",
    prompt: "Family beach portrait, golden hour lighting, ocean waves in background, casual beach attire, natural windswept hair, genuine laughter, sandy beach setting, sunset colors",
    category: "Outdoor",
    session_type: "family",
    is_active: true
  },
  {
    name: "Formal Family Portrait",
    description: "Classic elegant family portraits in formal attire",
    prompt: "Formal family portrait, studio lighting, elegant formal attire, classic poses, sophisticated backdrop, professional composition, timeless style, refined expressions",
    category: "Formal",
    session_type: "family",
    is_active: true
  },
  {
    name: "Casual Home Life",
    description: "Natural family moments in comfortable home setting",
    prompt: "Casual family portrait at home, natural lighting, comfortable everyday clothes, genuine interactions, cozy living room setting, authentic family moments, relaxed poses",
    category: "Lifestyle",
    session_type: "family",
    is_active: true
  },
  {
    name: "Garden Party",
    description: "Elegant outdoor family gathering in beautiful garden",
    prompt: "Family garden party portrait, lush green garden background, soft natural lighting, spring/summer atmosphere, elegant casual attire, blooming flowers, outdoor celebration vibes",
    category: "Outdoor",
    session_type: "family",
    is_active: true
  },
  {
    name: "Autumn Harvest",
    description: "Warm family portraits with fall colors and seasonal elements",
    prompt: "Family autumn portrait, fall foliage background, warm orange and red colors, cozy sweaters, pumpkins and harvest elements, golden hour lighting, seasonal family gathering",
    category: "Seasonal",
    session_type: "family",
    is_active: true
  },
  {
    name: "Sports Family",
    description: "Active family portraits with sports and recreation theme",
    prompt: "Active family portrait, sports equipment, athletic wear, outdoor field or court setting, dynamic poses, team spirit, healthy lifestyle theme, energetic expressions",
    category: "Sports",
    session_type: "family",
    is_active: true
  },
  {
    name: "Vintage Classic",
    description: "Timeless family portraits with vintage styling",
    prompt: "Vintage style family portrait, classic 1950s aesthetic, retro clothing, sepia tones, old-fashioned props, timeless composition, nostalgic atmosphere, elegant vintage styling",
    category: "Vintage",
    session_type: "family",
    is_active: true
  },
  {
    name: "Adventure Family",
    description: "Outdoor adventure family portraits in natural settings",
    prompt: "Adventure family portrait, hiking trail or mountain background, outdoor gear, natural wilderness setting, family bonding in nature, rugged landscape, adventure spirit",
    category: "Adventure",
    session_type: "family",
    is_active: true
  },
  {
    name: "Cozy Winter",
    description: "Warm indoor family portraits with winter comfort theme",
    prompt: "Cozy winter family portrait, fireplace background, warm blankets, hot cocoa, comfortable winter clothing, indoor warmth, family snuggled together, soft lighting",
    category: "Seasonal",
    session_type: "family",
    is_active: true
  }
]

async function addFamilyThemes() {
  try {
    console.log('Adding family themes to database...')
    
    const { data, error } = await supabase
      .from('themes')
      .insert(familyThemes)
      .select()

    if (error) {
      console.error('Error adding themes:', error)
      return
    }

    console.log(`Successfully added ${data.length} family themes:`)
    data.forEach(theme => {
      console.log(`- ${theme.name} (${theme.category})`)
    })

  } catch (error) {
    console.error('Script error:', error)
  }
}

// Run the script
addFamilyThemes()
