import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { DeploymentStatusChecker } from '@/lib/deploymentStatusChecker'
import { SupabaseStorageManager } from '@/lib/supabaseStorage'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
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

    // Verify user owns this session
    const { data: photoshootSession, error: sessionError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('*')
      .eq('id', params.sessionId)
      .eq('user_id', session.user.id)
      .single()

    if (sessionError || !photoshootSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Ensure Supabase Storage bucket exists (only check once per session)
    await SupabaseStorageManager.ensureBucketExists()

    // Use deployment-friendly status checker
    const result = await DeploymentStatusChecker.checkSession(params.sessionId)

    // Get updated session data with children and themes
    const { data: updatedSession } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select(`
        *,
        children (name, age_in_months),
        themes (name, description)
      `)
      .eq('id', params.sessionId)
      .single()

    // Get generated images
    const { data: images } = await supabaseAdmin.instance
      .from('generated_images')
      .select('*')
      .eq('session_id', params.sessionId)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      session: updatedSession,
      images: images || [],
      updated: result.updated,
      status: result.status,
      message: result.message
    })

  } catch (error: any) {
    console.error('Auto-update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
