import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard'

  if (code) {
    const { cookies } = await import('next/headers')
    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (session && session.user && !error) {
      // Create user profile if it doesn't exist
      await createUserProfile(session.user)
    }
  }

  // Redirect to the intended destination
  return NextResponse.redirect(new URL(redirectTo, request.url))
}

async function createUserProfile(user: any) {
  try {
    if (!supabaseAdmin.instance) {
      console.error('Supabase admin client not available')
      return
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.instance
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      console.log(`User profile already exists for ${user.email}`)
      return
    }

    // Extract user information
    const email = user.email || ''
    const fullName = user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    email.split('@')[0] || 
                    'User'

    // Create user profile
    const { data: newUser, error: createError } = await supabaseAdmin.instance
      .from('users')
      .insert({
        id: user.id,
        email: email,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || null,
        provider: user.app_metadata?.provider || 'email',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create user profile:', createError)
    } else {
      console.log(`✅ Created user profile for ${email} (${user.id})`)
    }

  } catch (error) {
    console.error('Error creating user profile:', error)
  }
}
