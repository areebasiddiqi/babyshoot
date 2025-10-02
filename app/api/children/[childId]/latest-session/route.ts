import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session: authSession } } = await supabase.auth.getSession()
    
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authSession.user

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get the latest completed session for this child
    const { data: session, error } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select(`
        id,
        uploaded_photos,
        model_id,
        training_job_id,
        created_at
      `)
      .eq('child_id', params.childId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('model_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'No completed session found for this child' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
