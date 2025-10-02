import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'

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

    // Get the photoshoot session
    const { data: photoshootSession, error: sessionError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('*')
      .eq('id', params.sessionId)
      .eq('user_id', session.user.id)
      .single()

    if (sessionError || !photoshootSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // If already completed, return current status
    if (photoshootSession.status === 'ready' || photoshootSession.status === 'completed') {
      return NextResponse.json({ 
        status: photoshootSession.status,
        message: 'Training already completed'
      })
    }

    // Check Astria training status
    if (!photoshootSession.training_job_id) {
      return NextResponse.json({ error: 'No training job ID found' }, { status: 400 })
    }

    try {
      const astriaStatus = await AstriaAPI.getTrainingStatus(photoshootSession.training_job_id)
      let newStatus = photoshootSession.status
      let modelId = photoshootSession.model_id

      // Check if training is completed
      const astriaData = astriaStatus as any
      if (astriaData.trained_at && !astriaData.failed_at) {
        newStatus = 'ready'
        modelId = astriaStatus.id.toString()
        
        // Update database
        await supabaseAdmin.instance
          .from('photoshoot_sessions')
          .update({
            status: newStatus,
            model_id: modelId,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.sessionId)

        console.log(`Training completed for session ${params.sessionId}`)

        return NextResponse.json({
          status: newStatus,
          model_id: modelId,
          message: 'Training completed! Ready to generate images.',
          astria_data: astriaStatus
        })
      } else if (astriaData.failed_at) {
        newStatus = 'failed'
        
        // Update database
        await supabaseAdmin.instance
          .from('photoshoot_sessions')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.sessionId)

        return NextResponse.json({
          status: newStatus,
          message: 'Training failed',
          astria_data: astriaStatus
        })
      } else {
        // Still training
        return NextResponse.json({
          status: 'training',
          message: 'Training still in progress',
          eta: astriaStatus.eta,
          astria_data: astriaStatus
        })
      }

    } catch (astriaError: any) {
      console.error('Failed to check Astria status:', astriaError)
      return NextResponse.json({ 
        error: 'Failed to check training status',
        details: astriaError.message 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
