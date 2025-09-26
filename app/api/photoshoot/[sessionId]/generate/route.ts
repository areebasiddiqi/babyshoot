import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'

export async function POST(
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

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get session details
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('photoshoot_sessions')
      .select('*')
      .eq('id', params.sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status !== 'ready') {
      return NextResponse.json({ 
        error: 'Session is not ready for generation' 
      }, { status: 400 })
    }

    if (!session.model_id) {
      return NextResponse.json({ 
        error: 'No trained model available' 
      }, { status: 400 })
    }

    try {
      // Update session status to generating
      await supabaseAdmin
        .from('photoshoot_sessions')
        .update({ status: 'generating' })
        .eq('id', params.sessionId)

      // Create the prompt text with the ohwx token
      const promptText = `ohwx person ${session.enhanced_prompt}`
      console.log('Generating images with prompt:', promptText)

      // Generate images using the trained model (creates a prompt in Astria)
      const generationJob = await AstriaAPI.generateImages(
        session.model_id,
        promptText,
        6 // Generate 6 images
      )

      // Store the generation job details in the session
      await supabaseAdmin
        .from('photoshoot_sessions')
        .update({ 
          generation_job_id: generationJob.id.toString(),
          generation_prompt: promptText
        })
        .eq('id', params.sessionId)

      // Create placeholder records for generated images
      const imageRecords = Array.from({ length: 6 }, (_, index) => ({
        session_id: params.sessionId,
        image_url: '', // Will be updated when generation completes
        prompt: promptText,
        status: 'generating' as const,
        astria_prompt_id: generationJob.id.toString(),
        seed: null // Will be updated from Astria response
      }))

      const { data: images, error: imagesError } = await supabaseAdmin
        .from('generated_images')
        .insert(imageRecords)
        .select()

      if (imagesError) {
        console.error('Failed to create image records:', imagesError)
        throw new Error('Failed to create image records')
      }

      return NextResponse.json({
        message: 'Image generation started',
        promptId: generationJob.id,
        tuneId: session.model_id,
        prompt: promptText,
        imageIds: images.map(img => img.id)
      })

    } catch (astriaError) {
      console.error('Astria generation error:', astriaError)
      
      // Update session status back to ready
      await supabaseAdmin
        .from('photoshoot_sessions')
        .update({ status: 'ready' })
        .eq('id', params.sessionId)

      return NextResponse.json({ 
        error: 'Failed to start image generation' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
