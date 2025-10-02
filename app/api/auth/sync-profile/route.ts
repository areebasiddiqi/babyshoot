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

    // Extract user information
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

    // Upsert user profile (create or update)
    const { data: userProfile, error: userError } = await supabaseAdmin.instance
      .from('users')
      .upsert({
        id: user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        image_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (userError) {
      console.error('Failed to sync user profile:', userError)
      return NextResponse.json({ 
        error: 'Failed to sync user profile',
        details: userError.message 
      }, { status: 500 })
    }

    // Create subscription if it doesn't exist
    const { data: existingSubscription } = await supabaseAdmin.instance
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!existingSubscription) {
      const { error: subscriptionError } = await supabaseAdmin.instance
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'free',
          status: 'active',
          photoshoots_used: 0,
          photoshoots_limit: 1,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })

      if (subscriptionError) {
        console.error('Failed to create subscription:', subscriptionError)
        // Don't fail the request if subscription creation fails
      }
    }

    console.log(`✅ Synced user profile for ${email} (${user.id})`)

    return NextResponse.json({
      message: 'User profile synced successfully',
      user: userProfile
    })

  } catch (error: any) {
    console.error('Sync profile error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
