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

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    console.log('🖼️ Starting automatic generation status check...')

    // Get all sessions that are currently generating
    const { data: generatingSessions, error: fetchError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('*')
      .eq('status', 'generating')
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
        console.log(`🔍 Checking session ${session.id}`)

        // Get all image records for this session that are still generating
        const { data: generatingImages } = await supabaseAdmin.instance
          .from('generated_images')
          .select('id, astria_prompt_id, status')
          .eq('session_id', session.id)
          .eq('status', 'generating')

        if (!generatingImages || generatingImages.length === 0) {
          console.log(`✅ Session ${session.id} - all images already completed`)
          
          // Update session status to completed if not already
          if (session.status === 'generating') {
            await supabaseAdmin.instance
              .from('photoshoot_sessions')
              .update({
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', session.id)
            
            updatedCount++
          }
          
          results.push({
            sessionId: session.id,
            status: 'completed',
            imageCount: 0
          })
          continue
        }

        console.log(`📋 Session ${session.id} - checking ${generatingImages.length} generating images`)

        let completedThisRound = 0
        let failedThisRound = 0

        // Check each generating image
        for (const imageRecord of generatingImages) {
          try {
            console.log(`🔍 Checking image ${imageRecord.id} with prompt ${imageRecord.astria_prompt_id}`)
            
            const astriaStatus = await AstriaAPI.getGenerationStatus(
              session.model_id, 
              imageRecord.astria_prompt_id
            )

            if (astriaStatus.images && astriaStatus.images.length > 0) {
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
                await supabaseAdmin.instance
                  .from('generated_images')
                  .update({
                    image_url: imageUrl,
                    seed: imageSeed,
                    status: 'completed'
                  })
                  .eq('id', imageRecord.id)

                completedThisRound++
                console.log(`✅ Image ${imageRecord.id} completed: ${imageUrl}`)
              }

            } else if (astriaStatus.status === 'failed' || (astriaStatus as any).user_error) {
              await supabaseAdmin.instance
                .from('generated_images')
                .update({ status: 'failed' })
                .eq('id', imageRecord.id)

              failedThisRound++
              console.log(`❌ Image ${imageRecord.id} failed`)
            } else {
              console.log(`⏳ Image ${imageRecord.id} still generating`)
            }
          } catch (imageError) {
            console.error(`Error checking image ${imageRecord.id}:`, imageError)
          }
        }

        // Check if all images for this session are done
        const { data: allSessionImages } = await supabaseAdmin.instance
          .from('generated_images')
          .select('status')
          .eq('session_id', session.id)

        const stillGenerating = allSessionImages?.filter((img: any) => img.status === 'generating').length || 0

        if (stillGenerating === 0) {
          // All images are done, update session status
          const allCompleted = allSessionImages?.every((img: any) => img.status === 'completed')
          const sessionStatus = allCompleted ? 'completed' : 'failed'

          await supabaseAdmin.instance
            .from('photoshoot_sessions')
            .update({
              status: sessionStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id)

          console.log(`🎉 Session ${session.id} all images done! Status: ${sessionStatus}`)

          results.push({
            sessionId: session.id,
            status: sessionStatus,
            imageCount: allSessionImages?.length || 0,
            completedImages: allSessionImages?.filter((img: any) => img.status === 'completed').length || 0
          })
        } else {
          console.log(`⏳ Session ${session.id} - ${completedThisRound} completed this round, ${stillGenerating} still generating`)
          results.push({
            sessionId: session.id,
            completedThisRound,
            stillGenerating
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
