// Script to fix existing users who don't have profiles in the users table
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixExistingUsers() {
  try {
    console.log('🔍 Checking for users without profiles...')

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Failed to fetch auth users:', authError)
      return
    }

    console.log(`📋 Found ${authUsers.users.length} auth users`)

    // Get existing user profiles
    const { data: existingProfiles, error: profileError } = await supabase
      .from('users')
      .select('id')

    if (profileError) {
      console.error('Failed to fetch user profiles:', profileError)
      return
    }

    const existingProfileIds = new Set(existingProfiles.map(p => p.id))
    const missingProfiles = authUsers.users.filter(user => !existingProfileIds.has(user.id))

    console.log(`❌ Found ${missingProfiles.length} users without profiles`)

    if (missingProfiles.length === 0) {
      console.log('✅ All users have profiles!')
      return
    }

    // Create missing profiles
    for (const user of missingProfiles) {
      try {
        const email = user.email || ''
        const fullName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        email.split('@')[0] || 
                        'User'
        
        const firstName = user.user_metadata?.first_name || 
                         fullName.split(' ')[0] || 
                         ''
        
        const lastName = user.user_metadata?.last_name || 
                        fullName.split(' ').slice(1).join(' ') || 
                        ''

        // Create user profile
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            image_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            created_at: user.created_at,
            updated_at: new Date().toISOString()
          })

        if (createError) {
          console.error(`❌ Failed to create profile for ${email}:`, createError.message)
          continue
        }

        // Create subscription if it doesn't exist
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!existingSubscription) {
          await supabase
            .from('subscriptions')
            .insert({
              user_id: user.id,
              plan: 'free',
              status: 'active',
              photoshoots_used: 0,
              photoshoots_limit: 1,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
        }

        console.log(`✅ Created profile for ${email} (${user.id})`)

      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error)
      }
    }

    console.log('🎉 Finished fixing user profiles!')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

fixExistingUsers()
