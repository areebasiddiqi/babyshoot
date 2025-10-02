import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get user credit balance using the database function
    const { data: balance, error } = await supabaseAdmin.instance.rpc('get_user_credit_balance', {
      user_uuid: user.id
    })

    if (error) {
      console.error('Error fetching credit balance:', error)
      return NextResponse.json({ error: 'Failed to fetch credit balance' }, { status: 500 })
    }

    return NextResponse.json({ 
      balance: balance || 0,
      userId: user.id 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
