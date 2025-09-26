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
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get the photoshoot session
    const { data: photoshootSession, error: sessionError } = await supabaseAdmin
      .from('photoshoot_sessions')
      .select('*')
      .eq('id', params.sessionId)
      .eq('user_id', session.user.id)
      .single()

    if (sessionError || !photoshootSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if session has generation job
    if (!photoshootSession.generation_job_id || !photoshootSession.model_id) {
      return NextResponse.json({ 
        error: 'No generation job found for this session',
        session: photoshootSession
      }, { status: 400 })
    }

    console.log(`🔍 Manually checking generation status for session ${params.sessionId}`)
    console.log(`📋 Tune ID: ${photoshootSession.model_id}, Prompt ID: ${photoshootSession.generation_job_id}`)

    try {
      // Check Astria API status
      const astriaStatus = await AstriaAPI.getGenerationStatus(
        photoshootSession.model_id, 
        photoshootSession.generation_job_id
      )
      
      console.log(`📊 Astria generation status:`, JSON.stringify(astriaStatus, null, 2))

      // Check if generation is completed
      if (astriaStatus.status === 'completed' && astriaStatus.images && astriaStatus.images.length > 0) {
        console.log(`✅ Generation completed! Found ${astriaStatus.images.length} images`)
        
        // Update session status
        await supabaseAdmin
          .from('photoshoot_sessions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', params.sessionId)

        // Get existing image records for this session
        const { data: existingImages } = await supabaseAdmin
          .from('generated_images')
          .select('id')
          .eq('session_id', params.sessionId)
          .eq('astria_prompt_id', photoshootSession.generation_job_id)
          .order('created_at', { ascending: true })

        console.log(`📋 Found ${existingImages?.length || 0} existing image records`)

        // Update generated images with actual URLs
        const updatedImages = []
        for (let i = 0; i < Math.min(astriaStatus.images.length, existingImages?.length || 0); i++) {
          const image = astriaStatus.images[i] as any
          const existingImage = existingImages?.[i]
          
          if (existingImage && image && typeof image === 'object' && image.url) {
            const { data: updatedImage } = await supabaseAdmin
              .from('generated_images')
              .update({
                image_url: image.url,
                seed: image.seed || null,
                status: 'completed'
              })
              .eq('id', existingImage.id)
              .select()
              .single()

            updatedImages.push(updatedImage)
            console.log(`✅ Updated image ${i + 1}: ${image.url}`)
          }
        }

        return NextResponse.json({
          status: 'completed',
          message: 'Generation completed and database updated',
          imageCount: astriaStatus.images.length,
          updatedImages: updatedImages,
          astriaData: astriaStatus
        })

      } else if (astriaStatus.status === 'failed') {
        console.log(`❌ Generation failed!`)
        
        // Update session and images to failed
        await supabaseAdmin
          .from('photoshoot_sessions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', params.sessionId)

        await supabaseAdmin
          .from('generated_images')
          .update({ status: 'failed' })
          .eq('session_id', params.sessionId)

        return NextResponse.json({
          status: 'failed',
          message: 'Generation failed',
          astriaData: astriaStatus
        })

      } else {
        // Still generating
        console.log(`⏳ Still generating...`)
        return NextResponse.json({
          status: 'generating',
          message: 'Generation still in progress',
          astriaData: astriaStatus
        })
      }

    } catch (astriaError: any) {
      console.error('Failed to check Astria status:', astriaError)
      return NextResponse.json({ 
        error: 'Failed to check generation status',
        details: astriaError.message,
        session: photoshootSession
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
