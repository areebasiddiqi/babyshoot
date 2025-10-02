import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get all sessions that are currently generating
    const { data: generatingSessions, error: fetchError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('*')
      .eq('status', 'generating')

    console.log('🔍 Found generating sessions:', generatingSessions)

    if (!generatingSessions || generatingSessions.length === 0) {
      return NextResponse.json({ 
        message: 'No generating sessions found',
        sessions: []
      })
    }

    const results = []

    for (const session of generatingSessions) {
      try {
        console.log(`📋 Session ${session.id}:`)
        console.log(`  - Model ID: ${session.model_id}`)
        console.log(`  - Generation Job ID: ${session.generation_job_id}`)
        console.log(`  - Status: ${session.status}`)

        // Get generated images for this session
        const { data: images } = await supabaseAdmin.instance
          .from('generated_images')
          .select('*')
          .eq('session_id', session.id)

        console.log(`  - Generated images count: ${images?.length || 0}`)
        
        if (session.model_id && session.generation_job_id) {
          // Check Astria status
          try {
            const astriaStatus = await AstriaAPI.getGenerationStatus(
              session.model_id,
              session.generation_job_id
            )
            
            console.log(`  - Astria status: ${astriaStatus.status}`)
            console.log(`  - Astria images count: ${astriaStatus.images?.length || 0}`)

            results.push({
              sessionId: session.id,
              modelId: session.model_id,
              generationJobId: session.generation_job_id,
              dbStatus: session.status,
              astriaStatus: astriaStatus.status,
              dbImagesCount: images?.length || 0,
              astriaImagesCount: astriaStatus.images?.length || 0,
              images: images,
              astriaImages: astriaStatus.images
            })

          } catch (astriaError: any) {
            console.log(`  - Astria error: ${astriaError.message}`)
            results.push({
              sessionId: session.id,
              modelId: session.model_id,
              generationJobId: session.generation_job_id,
              dbStatus: session.status,
              error: astriaError.message,
              images: images
            })
          }
        } else {
          results.push({
            sessionId: session.id,
            modelId: session.model_id,
            generationJobId: session.generation_job_id,
            dbStatus: session.status,
            error: 'Missing model_id or generation_job_id',
            images: images
          })
        }

      } catch (sessionError: any) {
        console.error(`❌ Error processing session ${session.id}:`, sessionError)
        results.push({
          sessionId: session.id,
          error: sessionError.message
        })
      }
    }

    return NextResponse.json({
      message: 'Debug information for generating sessions',
      count: generatingSessions.length,
      results: results
    })

  } catch (error: any) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
