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

    // Check if session has model
    if (!photoshootSession.model_id) {
      return NextResponse.json({ 
        error: 'No model found for this session',
        session: photoshootSession
      }, { status: 400 })
    }

    console.log(`🔍 Manually checking generation status for session ${params.sessionId}`)
    console.log(`📋 Tune ID: ${photoshootSession.model_id}`)

    // Get all image records for this session that are still generating
    const { data: generatingImages } = await supabaseAdmin.instance
      .from('generated_images')
      .select('id, astria_prompt_id, status')
      .eq('session_id', params.sessionId)
      .eq('status', 'generating')

    if (!generatingImages || generatingImages.length === 0) {
      return NextResponse.json({
        status: 'completed',
        message: 'All images already completed or no images found'
      })
    }

    console.log(`📋 Found ${generatingImages.length} images still generating`)

    try {
      let completedCount = 0
      let failedCount = 0
      const updatedImages = []

      // Check each generating image
      for (const imageRecord of generatingImages) {
        try {
          console.log(`🔍 Checking prompt ${imageRecord.astria_prompt_id}`)
          
          const astriaStatus = await AstriaAPI.getGenerationStatus(
            photoshootSession.model_id, 
            imageRecord.astria_prompt_id
          )

          if (astriaStatus.status === 'completed' && astriaStatus.images && astriaStatus.images.length > 0) {
            const image = astriaStatus.images[0] // Each prompt generates 1 image
            
            // Handle both string URLs and object formats
            let imageUrl = null
            let imageSeed = null
            
            if (typeof image === 'string') {
              imageUrl = image
            } else if (typeof image === 'object' && image && (image as any).url) {
              imageUrl = (image as any).url
              imageSeed = (image as any).seed
            }

            if (imageUrl) {
              const { data: updatedImage } = await supabaseAdmin.instance
                .from('generated_images')
                .update({
                  image_url: imageUrl,
                  seed: imageSeed,
                  status: 'completed'
                })
                .eq('id', imageRecord.id)
                .select()
                .single()

              updatedImages.push(updatedImage)
              completedCount++
              console.log(`✅ Image ${imageRecord.id} completed: ${imageUrl}`)
            }

          } else if (astriaStatus.status === 'failed') {
            await supabaseAdmin.instance
              .from('generated_images')
              .update({ status: 'failed' })
              .eq('id', imageRecord.id)

            failedCount++
            console.log(`❌ Image ${imageRecord.id} failed`)
          } else {
            console.log(`⏳ Image ${imageRecord.id} still generating`)
          }
        } catch (error) {
          console.error(`Error checking image ${imageRecord.id}:`, error)
        }
      }

      // Check if all images are done (completed or failed)
      const { data: allImages } = await supabaseAdmin.instance
        .from('generated_images')
        .select('status')
        .eq('session_id', params.sessionId)

      const stillGenerating = allImages?.filter((img: any) => img.status === 'generating').length || 0

      if (stillGenerating === 0) {
        // All images are done, update session status
        const allCompleted = allImages?.every((img: any) => img.status === 'completed')
        const sessionStatus = allCompleted ? 'completed' : 'failed'

        await supabaseAdmin.instance
          .from('photoshoot_sessions')
          .update({
            status: sessionStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.sessionId)

        console.log(`🎉 All images done! Session status: ${sessionStatus}`)

        return NextResponse.json({
          status: sessionStatus,
          message: `All images ${sessionStatus}`,
          totalImages: allImages?.length || 0,
          completedImages: allImages?.filter((img: any) => img.status === 'completed').length || 0,
          failedImages: allImages?.filter((img: any) => img.status === 'failed').length || 0,
          updatedImages: updatedImages
        })
      } else {
        return NextResponse.json({
          status: 'generating',
          message: `${completedCount} completed, ${stillGenerating} still generating`,
          totalImages: allImages?.length || 0,
          completedImages: allImages?.filter((img: any) => img.status === 'completed').length || 0,
          stillGenerating: stillGenerating,
          updatedImages: updatedImages
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
