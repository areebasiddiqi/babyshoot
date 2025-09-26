import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    console.log('🖼️ Starting automatic generation status check...')

    // Get all sessions that are currently generating
    const { data: generatingSessions, error: fetchError } = await supabaseAdmin
      .from('photoshoot_sessions')
      .select('*')
      .eq('status', 'generating')
      .not('generation_job_id', 'is', null)
      .not('model_id', 'is', null)

    if (fetchError) {
      console.error('Failed to fetch generating sessions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    if (!generatingSessions || generatingSessions.length === 0) {
      console.log('✅ No generating sessions to check')
      return NextResponse.json({ 
        message: 'No generating sessions to check',
        checked: 0,
        updated: 0
      })
    }

    console.log(`📋 Found ${generatingSessions.length} generating sessions to check`)

    let updatedCount = 0
    const results = []

    // Check each generating session
    for (const session of generatingSessions) {
      try {
        console.log(`🔍 Checking session ${session.id} with prompt ID ${session.generation_job_id}`)

        // Check Astria API status
        const astriaStatus = await AstriaAPI.getGenerationStatus(
          session.model_id, 
          session.generation_job_id
        )
        
        console.log(`📊 Astria generation status for session ${session.id}:`, JSON.stringify(astriaStatus, null, 2))

        // Check if generation is completed (Astria doesn't always return status field)
        if (astriaStatus.images && astriaStatus.images.length > 0) {
          console.log(`✅ Session ${session.id} generation completed! Found ${astriaStatus.images.length} images`)
          
          // Update session status
          await supabaseAdmin
            .from('photoshoot_sessions')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id)

          // Get existing image records for this session
          const { data: existingImages } = await supabaseAdmin
            .from('generated_images')
            .select('id')
            .eq('session_id', session.id)
            .eq('astria_prompt_id', session.generation_job_id)
            .order('created_at', { ascending: true })

          // Update generated images with actual URLs
          console.log(`🔍 Processing ${astriaStatus.images.length} images for session ${session.id}`)
          
          for (let i = 0; i < astriaStatus.images.length; i++) {
            const astriaImage = astriaStatus.images[i]
            
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
                
                const { error: updateError } = await supabaseAdmin
                  .from('generated_images')
                  .update({
                    image_url: imageUrl,
                    seed: imageSeed,
                    status: 'completed'
                  })
                  .eq('id', existingImages[i].id)

                if (updateError) {
                  console.error(`❌ Failed to update image ${i + 1}:`, updateError)
                } else {
                  console.log(`✅ Updated existing image ${i + 1}: ${imageUrl}`)
                }
              } else {
                // Create new record if none exists
                console.log(`📝 Creating new image record with URL: ${imageUrl}`)
                
                const { error: insertError } = await supabaseAdmin
                  .from('generated_images')
                  .insert({
                    session_id: session.id,
                    image_url: imageUrl,
                    prompt: session.generation_prompt || session.enhanced_prompt || '',
                    seed: imageSeed,
                    astria_prompt_id: session.generation_job_id,
                    status: 'completed'
                  })

                if (insertError) {
                  console.error(`❌ Failed to create image ${i + 1}:`, insertError)
                } else {
                  console.log(`✅ Created new image ${i + 1}: ${imageUrl}`)
                }
              }
            }
          }

          updatedCount++
          results.push({
            sessionId: session.id,
            status: 'completed',
            imageCount: astriaStatus.images.length
          })

        } else if (astriaStatus.status === 'failed' || (astriaStatus as any).user_error) {
          console.log(`❌ Session ${session.id} generation failed!`)
          
          // Update session and images to failed
          await supabaseAdmin
            .from('photoshoot_sessions')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id)

          await supabaseAdmin
            .from('generated_images')
            .update({ status: 'failed' })
            .eq('session_id', session.id)

          updatedCount++
          results.push({
            sessionId: session.id,
            status: 'failed'
          })

        } else {
          // Still generating
          console.log(`⏳ Session ${session.id} still generating...`)
          results.push({
            sessionId: session.id,
            status: 'still_generating'
          })
        }

      } catch (sessionError: any) {
        console.error(`❌ Error checking session ${session.id}:`, sessionError.message)
        results.push({
          sessionId: session.id,
          status: 'error',
          error: sessionError.message
        })
      }
    }

    console.log(`🎉 Completed generation status check. Updated ${updatedCount}/${generatingSessions.length} sessions`)

    return NextResponse.json({
      message: 'Generation status check completed',
      checked: generatingSessions.length,
      updated: updatedCount,
      results: results
    })

  } catch (error: any) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
