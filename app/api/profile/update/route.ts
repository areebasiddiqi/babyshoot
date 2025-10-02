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

    const user = session.user
    const { firstName, lastName } = await request.json()

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Update user profile in database
    const { error } = await supabaseAdmin.instance
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
