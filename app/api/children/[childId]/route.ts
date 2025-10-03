import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
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

    // First, verify the child belongs to the user
    const { data: child, error: fetchError } = await supabaseAdmin.instance
      .from('children')
      .select('id, user_id')
      .eq('id', params.childId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !child) {
      return NextResponse.json({ error: 'Child profile not found' }, { status: 404 })
    }

    // Check if there are any photoshoot sessions associated with this child
    const { data: sessions, error: sessionsError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('id')
      .eq('child_id', params.childId)

    if (sessionsError) {
      console.error('Error checking sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to check associated sessions' }, { status: 500 })
    }

    // If there are sessions, we need to decide whether to delete them or prevent deletion
    // For now, we'll prevent deletion if there are sessions
    if (sessions && sessions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete child profile with existing photoshoot sessions. Please delete the sessions first.' 
      }, { status: 400 })
    }

    // Delete the child profile
    const { error: deleteError } = await supabaseAdmin.instance
      .from('children')
      .delete()
      .eq('id', params.childId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete child error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete child profile' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Child profile deleted successfully' })
  } catch (error) {
    console.error('Delete child API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
