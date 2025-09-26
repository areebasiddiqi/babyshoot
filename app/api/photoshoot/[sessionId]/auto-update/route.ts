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

    let updated = false
    let updates: any = {}

    // Check training status if currently training
    if (photoshootSession.status === 'training' && photoshootSession.training_job_id) {
      try {
        const astriaStatus = await AstriaAPI.getTrainingStatus(photoshootSession.training_job_id)
        
        // Check if training is completed
        const astriaData = astriaStatus as any
        if (astriaData.trained_at && !astriaData.failed_at) {
          updates.status = 'ready'
          updates.model_id = astriaStatus.id.toString()
          updated = true
          console.log(`✅ Training completed for session ${params.sessionId}`)
        } else if (astriaData.failed_at) {
          updates.status = 'failed'
          updated = true
          console.log(`❌ Training failed for session ${params.sessionId}`)
        }
      } catch (error) {
        console.error('Failed to check training status:', error)
      }
    }

    // Check generation status if currently generating
    if (photoshootSession.status === 'generating' && 
        photoshootSession.generation_job_id && 
        photoshootSession.model_id) {
      try {
        const astriaStatus = await AstriaAPI.getGenerationStatus(
          photoshootSession.model_id,
          photoshootSession.generation_job_id
        )
        
        // Check if images are available
        if (astriaStatus.images && astriaStatus.images.length > 0) {
          updates.status = 'completed'
          updated = true
          
          // Update generated images
          const { data: existingImages } = await supabaseAdmin
            .from('generated_images')
            .select('*')
            .eq('session_id', params.sessionId)
            .order('created_at', { ascending: true })

          // Update or create image records
          for (let i = 0; i < astriaStatus.images.length; i++) {
            const astriaImage = astriaStatus.images[i]
            
            let imageUrl = null
            let imageSeed = null
            
            if (typeof astriaImage === 'string') {
              imageUrl = astriaImage
            } else if (typeof astriaImage === 'object' && astriaImage && (astriaImage as any).url) {
              imageUrl = (astriaImage as any).url
              imageSeed = (astriaImage as any).seed
            }
            
            if (imageUrl) {
              if (existingImages && existingImages[i]) {
                // Update existing record
                await supabaseAdmin
                  .from('generated_images')
                  .update({
                    image_url: imageUrl,
                    seed: imageSeed,
                    status: 'completed'
                  })
                  .eq('id', existingImages[i].id)
              } else {
                // Create new record
                await supabaseAdmin
                  .from('generated_images')
                  .insert({
                    session_id: params.sessionId,
                    image_url: imageUrl,
                    prompt: photoshootSession.generation_prompt || photoshootSession.enhanced_prompt || '',
                    seed: imageSeed,
                    astria_prompt_id: photoshootSession.generation_job_id,
                    status: 'completed'
                  })
              }
            }
          }
          
          console.log(`✅ Generation completed for session ${params.sessionId}`)
        }
      } catch (error) {
        console.error('Failed to check generation status:', error)
      }
    }

    // Update session if needed
    if (updated) {
      updates.updated_at = new Date().toISOString()
      
      await supabaseAdmin
        .from('photoshoot_sessions')
        .update(updates)
        .eq('id', params.sessionId)
    }

    // Get updated session data
    const { data: updatedSession } = await supabaseAdmin
      .from('photoshoot_sessions')
      .select('*')
      .eq('id', params.sessionId)
      .single()

    // Get generated images
    const { data: images } = await supabaseAdmin
      .from('generated_images')
      .select('*')
      .eq('session_id', params.sessionId)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      session: updatedSession,
      images: images || [],
      updated: updated,
      updates: updates
    })

  } catch (error: any) {
    console.error('Auto-update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
