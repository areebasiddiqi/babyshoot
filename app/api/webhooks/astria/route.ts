import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log('Astria webhook received:', { type, data })

    if (type === 'tune.completed') {
      // Training completed
      const { id: jobId, model_id, status } = data

      if (status === 'completed' && model_id) {
        // Update session with model ID and set status to ready
        const { error } = await supabaseAdmin
          .from('photoshoot_sessions')
          .update({
            status: 'ready',
            model_id: model_id
          })
          .eq('training_job_id', jobId)

        if (error) {
          console.error('Failed to update session after training:', error)
        } else {
          console.log('Training completed for job:', jobId)
        }
      } else if (status === 'failed') {
        // Training failed
        await supabaseAdmin
          .from('photoshoot_sessions')
          .update({ status: 'failed' })
          .eq('training_job_id', jobId)

        console.log('Training failed for job:', jobId)
      }
    } else if (type === 'prompt.completed') {
      // Generation completed
      const { id: jobId, images, status } = data

      if (status === 'completed' && images && images.length > 0) {
        // Find the session associated with this generation job
        // Note: You'll need to store the generation job ID in your session or images table
        // For now, we'll update based on the most recent generating session
        
        const { data: session } = await supabaseAdmin
          .from('photoshoot_sessions')
          .select('id')
          .eq('status', 'generating')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (session) {
          // Update generated images with actual URLs
          const { data: generatedImages } = await supabaseAdmin
            .from('generated_images')
            .select('id')
            .eq('session_id', session.id)
            .eq('status', 'generating')
            .order('created_at', { ascending: true })

          if (generatedImages) {
            // Update each image record with the actual URL
            for (let i = 0; i < Math.min(images.length, generatedImages.length); i++) {
              await supabaseAdmin
                .from('generated_images')
                .update({
                  image_url: images[i],
                  thumbnail_url: images[i], // Use same URL for thumbnail for now
                  status: 'completed'
                })
                .eq('id', generatedImages[i].id)
            }

            // Update session status to completed
            await supabaseAdmin
              .from('photoshoot_sessions')
              .update({ status: 'completed' })
              .eq('id', session.id)

            console.log('Generation completed for session:', session.id)
          }
        }
      } else if (status === 'failed') {
        // Generation failed - update the most recent generating session
        const { data: session } = await supabaseAdmin
          .from('photoshoot_sessions')
          .select('id')
          .eq('status', 'generating')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (session) {
          await supabaseAdmin
            .from('photoshoot_sessions')
            .update({ status: 'failed' })
            .eq('id', session.id)

          // Update all generating images to failed
          await supabaseAdmin
            .from('generated_images')
            .update({ status: 'failed' })
            .eq('session_id', session.id)
            .eq('status', 'generating')

          console.log('Generation failed for session:', session.id)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
