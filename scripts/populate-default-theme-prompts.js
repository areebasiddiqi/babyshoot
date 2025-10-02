const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = "https://wuhwvnkquzhvdztrmqoo.supabase.co"
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHd2bmtxdXpodmR6dHJtcW9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2MDcyNCwiZXhwIjoyMDc0NDM2NzI0fQ.z_rev9VLzzLR_k4kvpkvq_U9k08LbMG2RFIdiA_qtPE"

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Default prompt variations for different themes
const defaultPromptVariations = {
  // Child-focused variations
  child: [
    'sitting on a colorful playground, bright sunny day, joyful expression',
    'playing with toys in a cozy room, warm lighting, natural smile',
    'in a beautiful garden with flowers, golden hour lighting, candid moment',
    'wearing a favorite outfit, studio lighting, confident pose',
    'reading a book in a library corner, soft natural light, peaceful expression',
    'playing dress-up with costumes, fun colorful background, playful mood',
    'having a picnic in the park, outdoor natural lighting, happy moment',
    'building with blocks, creative play area, focused concentration',
    'dancing or jumping, dynamic movement, pure joy expression',
    'cuddling with a favorite stuffed animal, cozy bedroom, tender moment'
  ],
  
  // Family-focused variations
  family: [
    'gathered around a dining table, warm home lighting, sharing a meal',
    'walking together in a park, natural outdoor setting, connected moment',
    'playing games in the living room, cozy indoor atmosphere, laughter',
    'having a beach day, ocean backdrop, relaxed vacation vibes',
    'celebrating a special occasion, festive decorations, joy and excitement',
    'cooking together in the kitchen, warm home environment, teamwork',
    'reading stories before bedtime, soft bedroom lighting, intimate moment',
    'enjoying outdoor activities, nature setting, active family time',
    'taking a formal portrait, elegant studio setup, classic composition',
    'sharing quiet moments at home, comfortable living space, natural connection'
  ],
  
  // Fantasy/Adventure variations (both)
  fantasy: [
    'in an enchanted forest with magical creatures, mystical lighting',
    'on a grand adventure quest, epic landscape background',
    'discovering hidden treasures, mysterious cave setting',
    'flying through clouds on a magical journey, dreamy sky backdrop',
    'meeting friendly forest animals, whimsical woodland scene',
    'casting spells with magical wands, sparkly magical effects',
    'exploring an ancient castle, medieval fantasy atmosphere',
    'riding mythical creatures, fantastical landscape',
    'in a fairy tale garden, blooming flowers and butterflies',
    'on a pirate ship adventure, ocean and treasure theme'
  ]
}

async function generatePromptsForTheme(theme) {
  const basePrompt = theme.prompt
  let variations = []
  
  // Choose variation set based on theme characteristics
  if (theme.session_type === 'family') {
    variations = defaultPromptVariations.family
  } else if (theme.category === 'fantasy' || theme.category === 'adventure') {
    variations = defaultPromptVariations.fantasy
  } else {
    variations = defaultPromptVariations.child
  }
  
  // Generate prompts by combining base prompt with variations
  const prompts = variations.slice(0, theme.image_count || 10).map((variation, index) => ({
    theme_id: theme.id,
    prompt_text: `${basePrompt}, ${variation}`,
    prompt_order: index + 1,
    is_active: true
  }))
  
  return prompts
}

async function populateThemePrompts() {
  try {
    console.log('Fetching existing themes...')
    
    // Get all active themes
    const { data: themes, error: themesError } = await supabase
      .from('themes')
      .select('*')
      .eq('is_active', true)
    
    if (themesError) {
      throw new Error(`Failed to fetch themes: ${themesError.message}`)
    }
    
    console.log(`Found ${themes.length} active themes`)
    
    for (const theme of themes) {
      console.log(`Processing theme: ${theme.name}`)
      
      // Check if theme already has prompts
      const { data: existingPrompts, error: checkError } = await supabase
        .from('theme_prompts')
        .select('id')
        .eq('theme_id', theme.id)
        .limit(1)
      
      if (checkError) {
        console.error(`Error checking existing prompts for ${theme.name}:`, checkError)
        continue
      }
      
      if (existingPrompts && existingPrompts.length > 0) {
        console.log(`  Skipping ${theme.name} - already has prompts`)
        continue
      }
      
      // Generate prompts for this theme
      const prompts = await generatePromptsForTheme(theme)
      
      // Insert prompts
      const { error: insertError } = await supabase
        .from('theme_prompts')
        .insert(prompts)
      
      if (insertError) {
        console.error(`Failed to insert prompts for ${theme.name}:`, insertError)
        continue
      }
      
      console.log(`  ✅ Created ${prompts.length} prompts for ${theme.name}`)
    }
    
    console.log('\n✅ Successfully populated theme prompts!')
    
  } catch (error) {
    console.error('Error populating theme prompts:', error)
    process.exit(1)
  }
}

// Run the script
populateThemePrompts()
