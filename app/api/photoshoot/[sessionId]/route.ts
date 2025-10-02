import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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

    const { data: session, error } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select(`
        *,
        children (name, age_in_months),
        themes (name, description),
        generated_images (*)
      `)
      .eq('id', params.sessionId)
      .eq('user_id', user.id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
