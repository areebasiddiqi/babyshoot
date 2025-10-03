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

export async function DELETE(
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

    // First, verify the session belongs to the user
    const { data: session, error: fetchError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('id, user_id')
      .eq('id', params.sessionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Delete associated records in the correct order to avoid foreign key constraint violations
    
    // 1. Delete credit transactions first (they reference photoshoot_sessions)
    const { error: creditError } = await supabaseAdmin.instance
      .from('credit_transactions')
      .delete()
      .eq('photoshoot_session_id', params.sessionId)

    if (creditError) {
      console.error('Delete credit transactions error:', creditError)
      // Continue anyway - credit transactions might not exist
    }

    // 2. Delete generated images
    const { error: imagesError } = await supabaseAdmin.instance
      .from('generated_images')
      .delete()
      .eq('session_id', params.sessionId)

    if (imagesError) {
      console.error('Delete generated images error:', imagesError)
      // Continue anyway - images might not exist
    }

    // 3. Finally delete the photoshoot session
    const { error: deleteError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .delete()
      .eq('id', params.sessionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete session error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
