import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'
import { SupabaseStorageManager } from '@/lib/supabaseStorage'

// Deployment-friendly status checker that works in serverless environments
export class DeploymentStatusChecker {
  
  // Check a single session's status
  static async checkSession(sessionId: string): Promise<{
    updated: boolean
    status: string
    message?: string
  }> {
    try {
      if (!supabaseAdmin.instance) {
        throw new Error('Supabase admin client not available')
      }

      // Get the session
      const { data: session, error: sessionError } = await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError || !session) {
        throw new Error('Session not found')
      }

      let updated = false
      const updates: any = {}

      // Check training status if training
      if (session.status === 'training' && session.training_job_id) {
        try {
          const astriaStatus = await AstriaAPI.getTrainingStatus(session.training_job_id)
          const astriaData = astriaStatus as any
          
          if (astriaData.trained_at && !astriaData.failed_at) {
            updates.status = 'ready'
            updates.model_id = astriaStatus.id.toString()
            updated = true
            console.log(`✅ Training completed for session ${sessionId}`)
          } else if (astriaData.failed_at) {
            updates.status = 'failed'
            updated = true
            console.log(`❌ Training failed for session ${sessionId}`)
          }
        } catch (error) {
          console.error(`Failed to check training status for ${sessionId}:`, error)
        }
      }

      // Check generation status if generating
      if (session.status === 'generating' && session.model_id) {
        try {
          // Get all image records for this session that are still generating
          const { data: generatingImages } = await supabaseAdmin.instance
            .from('generated_images')
            .select('id, astria_prompt_id, status')
            .eq('session_id', sessionId)
            .eq('status', 'generating')

          if (!generatingImages || generatingImages.length === 0) {
            // All images already completed
            updates.status = 'completed'
            updated = true
            console.log(`✅ All images already completed for session ${sessionId}`)
          } else {
            // Check each generating image
            let completedThisRound = 0
            
            for (const imageRecord of generatingImages) {
              try {
                const astriaStatus = await AstriaAPI.getGenerationStatus(
                  session.model_id,
                  imageRecord.astria_prompt_id
                )
                
                if (astriaStatus.images && astriaStatus.images.length > 0) {
                  const image = astriaStatus.images[0]
                  
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
                    // Download image from Astria and store in Supabase Storage
                    console.log(`📥 Processing image ${imageRecord.id} from Astria URL: ${imageUrl}`)
                    
                    const storedImageUrl = await SupabaseStorageManager.downloadAndStoreImage(
                      imageUrl,
                      sessionId,
                      imageRecord.id
                    )

                    if (storedImageUrl) {
                      // Update with Supabase Storage URL
                      await supabaseAdmin.instance
                        .from('generated_images')
                        .update({
                          image_url: storedImageUrl,
                          astria_url: imageUrl, // Keep original Astria URL for reference
                          seed: imageSeed,
                          status: 'completed'
                        })
                        .eq('id', imageRecord.id)

                      completedThisRound++
                      console.log(`✅ Image ${imageRecord.id} stored in Supabase Storage: ${storedImageUrl}`)
                    } else {
                      // Fallback to Astria URL if storage fails
                      console.warn(`⚠️ Failed to store image ${imageRecord.id} in Supabase Storage, using Astria URL`)
                      
                      await supabaseAdmin.instance
                        .from('generated_images')
                        .update({
                          image_url: imageUrl,
                          seed: imageSeed,
                          status: 'completed'
                        })
                        .eq('id', imageRecord.id)

                      completedThisRound++
                    }
                  }
                } else if (astriaStatus.status === 'failed' || (astriaStatus as any).user_error) {
                  await supabaseAdmin.instance
                    .from('generated_images')
                    .update({ status: 'failed' })
                    .eq('id', imageRecord.id)
                  
                  console.log(`❌ Image ${imageRecord.id} failed for session ${sessionId}`)
                }
              } catch (imageError) {
                console.error(`Error checking image ${imageRecord.id}:`, imageError)
              }
            }

            // Check if all images are now done
            const { data: allImages } = await supabaseAdmin.instance
              .from('generated_images')
              .select('status')
              .eq('session_id', sessionId)

            const stillGenerating = allImages?.filter((img: any) => img.status === 'generating').length || 0

            if (stillGenerating === 0) {
              // All images are done
              const allCompleted = allImages?.every((img: any) => img.status === 'completed')
              updates.status = allCompleted ? 'completed' : 'failed'
              updated = true
              
              console.log(`✅ All images done for session ${sessionId}. Status: ${updates.status}`)
            } else {
              console.log(`⏳ Session ${sessionId}: ${completedThisRound} completed this round, ${stillGenerating} still generating`)
            }
          }
        } catch (error) {
          console.error(`Failed to check generation status for ${sessionId}:`, error)
        }
      }

      // Update session if needed
      if (updated) {
        updates.updated_at = new Date().toISOString()
        
        await supabaseAdmin.instance
          .from('photoshoot_sessions')
          .update(updates)
          .eq('id', sessionId)
      }

      return {
        updated,
        status: updated ? updates.status : session.status,
        message: updated ? 'Status updated successfully' : 'No updates needed'
      }

    } catch (error: any) {
      console.error(`Error checking session ${sessionId}:`, error)
      return {
        updated: false,
        status: 'error',
        message: error.message
      }
    }
  }

  // Check all pending sessions (for batch operations)
  static async checkAllPendingSessions(): Promise<{
    checked: number
    updated: number
    results: Array<{ sessionId: string; status: string; updated: boolean }>
  }> {
    try {
      if (!supabaseAdmin.instance) {
        throw new Error('Supabase admin client not available')
      }

      // Get all pending sessions
      const { data: pendingSessions, error: fetchError } = await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select('id, status, training_job_id, generation_job_id, model_id')
        .in('status', ['training', 'generating'])

      if (fetchError) {
        throw new Error(`Failed to fetch pending sessions: ${fetchError.message}`)
      }

      if (!pendingSessions || pendingSessions.length === 0) {
        return { checked: 0, updated: 0, results: [] }
      }

      console.log(`🔍 Checking ${pendingSessions.length} pending sessions`)

      const results = []
      let updatedCount = 0

      for (const session of pendingSessions) {
        const result = await this.checkSession(session.id)
        results.push({
          sessionId: session.id,
          status: result.status,
          updated: result.updated
        })
        
        if (result.updated) {
          updatedCount++
        }
      }

      console.log(`🎉 Checked ${pendingSessions.length} sessions, updated ${updatedCount}`)

      return {
        checked: pendingSessions.length,
        updated: updatedCount,
        results
      }

    } catch (error: any) {
      console.error('Error in checkAllPendingSessions:', error)
      throw error
    }
  }


  // Check if a session needs status checking
  static shouldCheckSession(session: any): boolean {
    if (!session) return false
    
    const status = session.status
    const lastUpdated = new Date(session.updated_at || session.created_at)
    const now = new Date()
    const timeDiff = now.getTime() - lastUpdated.getTime()
    const minutesDiff = timeDiff / (1000 * 60)

    // Check training sessions older than 2 minutes
    if (status === 'training' && minutesDiff > 2) {
      return true
    }

    // Check generating sessions older than 1 minute
    if (status === 'generating' && minutesDiff > 1) {
      return true
    }

    return false
  }
}
