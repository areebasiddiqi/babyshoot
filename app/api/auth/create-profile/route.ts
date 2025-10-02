import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const user = session.user

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.instance
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User profile already exists',
        user: existingUser 
      })
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
      return NextResponse.json({ 
        error: 'Failed to create user profile',
        details: createError.message 
      }, { status: 500 })
    }

    console.log(`✅ Created user profile for ${email} (${user.id})`)

    return NextResponse.json({
      message: 'User profile created successfully',
      user: newUser
    })

  } catch (error: any) {
    console.error('Create profile error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
