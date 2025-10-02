import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, tuneId, promptId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    console.log(`🔧 Force updating images for session: ${sessionId}`)

    // Get the session
    const { data: session, error: sessionError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    console.log(`📋 Session details:`)
    console.log(`  - Model ID: ${session.model_id}`)
    console.log(`  - Generation Job ID: ${session.generation_job_id}`)
    console.log(`  - Status: ${session.status}`)

    // Use provided IDs or session IDs
    const finalTuneId = tuneId || session.model_id
    const finalPromptId = promptId || session.generation_job_id

    if (!finalTuneId || !finalPromptId) {
      return NextResponse.json({ 
        error: 'Missing tune ID or prompt ID',
        session: session
      }, { status: 400 })
    }

    // Check Astria status
    console.log(`🔍 Checking Astria status for tune ${finalTuneId}, prompt ${finalPromptId}`)
    
    const astriaStatus = await AstriaAPI.getGenerationStatus(finalTuneId, finalPromptId)
    
    console.log(`📊 Astria response:`, JSON.stringify(astriaStatus, null, 2))

    // Check if images are available (Astria doesn't always return a status field)
    if (astriaStatus.images && astriaStatus.images.length > 0) {
      console.log(`✅ Images are ready! Found ${astriaStatus.images.length} images`)

      // Update session status
      await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      // Get existing image records
      const { data: existingImages } = await supabaseAdmin.instance
        .from('generated_images')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      console.log(`📋 Found ${existingImages?.length || 0} existing image records`)

      // Update or create image records
      const updatedImages = []
      
      console.log(`🔍 Processing ${astriaStatus.images.length} images from Astria`)
      console.log(`📋 Images array:`, JSON.stringify(astriaStatus.images, null, 2))
      
      for (let i = 0; i < astriaStatus.images.length; i++) {
        const astriaImage = astriaStatus.images[i]
        
        console.log(`🖼️ Processing image ${i + 1}:`, astriaImage)
        console.log(`🔍 Image type:`, typeof astriaImage)
        
        // Handle both string URLs and object formats
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
            console.log(`📝 Updating existing image record ${existingImages[i].id} with URL: ${imageUrl}`)
            
            const { data: updatedImage, error: updateError } = await supabaseAdmin.instance
              .from('generated_images')
              .update({
                image_url: imageUrl,
                seed: imageSeed,
                status: 'completed'
              })
              .eq('id', existingImages[i].id)
              .select()
              .single()

            if (updateError) {
              console.error(`❌ Failed to update image ${i + 1}:`, updateError)
            } else {
              updatedImages.push(updatedImage)
              console.log(`✅ Updated existing image ${i + 1}: ${imageUrl}`)
            }
          } else {
            // Create new record
            console.log(`📝 Creating new image record with URL: ${imageUrl}`)
            
            const { data: newImage, error: insertError } = await supabaseAdmin.instance
              .from('generated_images')
              .insert({
                session_id: sessionId,
                image_url: imageUrl,
                prompt: session.generation_prompt || session.enhanced_prompt || '',
                seed: imageSeed,
                astria_prompt_id: finalPromptId,
                status: 'completed'
              })
              .select()
              .single()

            if (insertError) {
              console.error(`❌ Failed to create image ${i + 1}:`, insertError)
            } else {
              updatedImages.push(newImage)
              console.log(`✅ Created new image ${i + 1}: ${imageUrl}`)
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Images updated successfully',
        sessionId: sessionId,
        imageCount: astriaStatus.images.length,
        updatedImages: updatedImages,
        astriaStatus: astriaStatus
      })

    } else {
      return NextResponse.json({
        success: false,
        message: `Generation not ready. Status: ${astriaStatus.status}`,
        astriaStatus: astriaStatus
      })
    }

  } catch (error: any) {
    console.error('❌ Force update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
