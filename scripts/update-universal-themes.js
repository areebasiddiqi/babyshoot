// Script to update existing themes to work for both child and family sessions
// Run with: node scripts/update-universal-themes.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Themes that work well for both children and families
const universalThemeNames = [
  'Magical Forest',
  'Princess Dreams',
  'Superhero Adventure',
  'Fairy Tale',
  'Space Explorer',
  'Pirate Adventure',
  'Safari Adventure',
  'Under the Sea',
  'Rainbow Dreams',
  'Enchanted Garden'
]

async function updateUniversalThemes() {
  try {
    console.log('Updating themes to work for both child and family sessions...')
    
    // First, get existing themes
    const { data: existingThemes, error: fetchError } = await supabase
      .from('themes')
      .select('*')
      .in('name', universalThemeNames)

    if (fetchError) {
      console.error('Error fetching themes:', fetchError)
      return
    }

    console.log(`Found ${existingThemes.length} themes to update`)

    // Update each theme to support both session types
    for (const theme of existingThemes) {
      const { error: updateError } = await supabase
        .from('themes')
        .update({ session_type: 'both' })
        .eq('id', theme.id)

      if (updateError) {
        console.error(`Error updating theme ${theme.name}:`, updateError)
      } else {
        console.log(`✅ Updated "${theme.name}" to support both session types`)
      }
    }

    // Set remaining themes to child-only if they don't have session_type set
    const { error: childOnlyError } = await supabase
      .from('themes')
      .update({ session_type: 'child' })
      .is('session_type', null)

    if (childOnlyError) {
      console.error('Error setting child-only themes:', childOnlyError)
    } else {
      console.log('✅ Set remaining themes to child-only')
    }

    console.log('Theme update completed!')

  } catch (error) {
    console.error('Script error:', error)
  }
}

// Run the script
updateUniversalThemes()
