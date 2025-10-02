import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, tuneId } = await request.json()

    if (!sessionId || !tuneId) {
      return NextResponse.json({ error: 'sessionId and tuneId are required' }, { status: 400 })
    }

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Update the session status to ready
    const { data: updatedSession, error } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .update({
        status: 'ready',
        model_id: tuneId,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      session: updatedSession
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
