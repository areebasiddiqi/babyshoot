const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeSuperAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`)
    
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', email)
      console.error('Error details:', userError)
      return
    }

    console.log(`👤 Found user: ${user.first_name} ${user.last_name} (${user.email})`)

    // Check if already super admin
    if (user.role === 'super_admin') {
      console.log(`✅ ${email} is already a super admin!`)
      return
    }

    // Update user role to super_admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'super_admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating user role:', updateError)
      return
    }

    console.log(`✅ Successfully made ${email} a super admin!`)
    console.log('User details:', {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.first_name
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('Please provide an email address')
  console.log('Usage: node scripts/make-super-admin.js user@example.com')
  process.exit(1)
}

makeSuperAdmin(email)
