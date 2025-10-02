import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const body = await request.json()
    const { id: jobId, object, status, model_id, images } = body

    console.log('Astria Webhook received:', { jobId, object, status, model_id, images: images?.length })

    if (object === 'tune') {
      // Model training completed
      console.log(`Webhook: Tune ${jobId} status: ${status}`)

      if (status === 'completed' && model_id) {
        // Update session with model ID and set status to ready
        const { error } = await supabaseAdmin.instance
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
        await supabaseAdmin.instance
          .from('photoshoot_sessions')
          .update({ status: 'failed' })
          .eq('training_job_id', jobId)

        console.log('Training failed for job:', jobId)
      }
    } else if (object === 'prompt') {
      // Generation completed for a single prompt
      console.log(`🎨 Webhook: Prompt ${jobId} status: ${status}`)

      if (status === 'completed' && images && images.length > 0) {
        // Find the specific image record for this job ID
        const { data: imageRecord } = await supabaseAdmin.instance
          .from('generated_images')
          .select('id, session_id')
          .eq('astria_prompt_id', jobId.toString())
          .eq('status', 'generating')
          .single()

        if (imageRecord) {
          // Update this specific image record
          await supabaseAdmin.instance
            .from('generated_images')
            .update({
              image_url: images[0], // Each prompt generates 1 image
              thumbnail_url: images[0],
              status: 'completed'
            })
            .eq('id', imageRecord.id)

          console.log(`✅ Webhook: Image ${imageRecord.id} completed for job ${jobId}`)

          // Check if ALL images for this session are now complete
          const { data: allSessionImages } = await supabaseAdmin.instance
            .from('generated_images')
            .select('status')
            .eq('session_id', imageRecord.session_id)

          const stillGenerating = allSessionImages?.filter((img: any) => img.status === 'generating').length || 0

          if (stillGenerating === 0) {
            // All images are done, update session status
            const allCompleted = allSessionImages?.every((img: any) => img.status === 'completed')
            const sessionStatus = allCompleted ? 'completed' : 'failed'

            await supabaseAdmin.instance
              .from('photoshoot_sessions')
              .update({ status: sessionStatus })
              .eq('id', imageRecord.session_id)

            console.log(`🎉 Webhook: All images done for session ${imageRecord.session_id}. Status: ${sessionStatus}`)
          } else {
            console.log(`⏳ Webhook: Session ${imageRecord.session_id} - ${stillGenerating} images still generating`)
          }
        } else {
          console.log(`⚠️ Webhook: No image record found for job ${jobId}`)
        }
      } else if (status === 'failed') {
        // Generation failed for a single prompt
        const { data: imageRecord } = await supabaseAdmin.instance
          .from('generated_images')
          .select('id, session_id')
          .eq('astria_prompt_id', jobId.toString())
          .eq('status', 'generating')
          .single()

        if (imageRecord) {
          // Update this specific image to failed
          await supabaseAdmin.instance
            .from('generated_images')
            .update({ status: 'failed' })
            .eq('id', imageRecord.id)

          console.log(`❌ Webhook: Image ${imageRecord.id} failed for job ${jobId}`)

          // Check if all images for this session are done
          const { data: allSessionImages } = await supabaseAdmin.instance
            .from('generated_images')
            .select('status')
            .eq('session_id', imageRecord.session_id)

          const stillGenerating = allSessionImages?.filter((img: any) => img.status === 'generating').length || 0

          if (stillGenerating === 0) {
            // All images are done
            const allCompleted = allSessionImages?.every((img: any) => img.status === 'completed')
            const sessionStatus = allCompleted ? 'completed' : 'failed'

            await supabaseAdmin.instance
              .from('photoshoot_sessions')
              .update({ status: sessionStatus })
              .eq('id', imageRecord.session_id)

            console.log(`🎉 Webhook: All images done for session ${imageRecord.session_id}. Status: ${sessionStatus}`)
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
