import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'

// Deployment-friendly status checker that works in serverless environments
export class DeploymentStatusChecker {
  
  // Check a single session's status
  static async checkSession(sessionId: string): Promise<{
    updated: boolean
    status: string
    message?: string
  }> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available')
      }

      // Get the session
      const { data: session, error: sessionError } = await supabaseAdmin
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
      if (session.status === 'generating' && session.generation_job_id && session.model_id) {
        try {
          const astriaStatus = await AstriaAPI.getGenerationStatus(
            session.model_id,
            session.generation_job_id
          )
          
          if (astriaStatus.images && astriaStatus.images.length > 0) {
            updates.status = 'completed'
            updated = true
            
            // Update generated images
            await this.updateGeneratedImages(sessionId, session.generation_job_id, astriaStatus.images)
            
            console.log(`✅ Generation completed for session ${sessionId}`)
          }
        } catch (error) {
          console.error(`Failed to check generation status for ${sessionId}:`, error)
        }
      }

      // Update session if needed
      if (updated) {
        updates.updated_at = new Date().toISOString()
        
        await supabaseAdmin
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
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available')
      }

      // Get all pending sessions
      const { data: pendingSessions, error: fetchError } = await supabaseAdmin
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

  // Update generated images helper
  private static async updateGeneratedImages(sessionId: string, promptId: string, images: any[]) {
    try {
      if (!supabaseAdmin) return

      // Get existing image records
      const { data: existingImages } = await supabaseAdmin
        .from('generated_images')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      // Update or create image records
      for (let i = 0; i < images.length; i++) {
        const astriaImage = images[i]
        
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
                session_id: sessionId,
                image_url: imageUrl,
                prompt: '',
                seed: imageSeed,
                astria_prompt_id: promptId,
                status: 'completed'
              })
          }
        }
      }
    } catch (error) {
      console.error('Failed to update generated images:', error)
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
