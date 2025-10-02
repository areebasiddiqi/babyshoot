import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'

class StatusChecker {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  start() {
    if (this.isRunning) {
      console.log('Status checker is already running')
      return
    }

    console.log('🚀 Starting automatic status checker (every 5 minutes)')
    this.isRunning = true
    
    // Check immediately
    this.checkAllSessions()
    
    // Then check every 5 minutes
    this.intervalId = setInterval(() => {
      this.checkAllSessions()
    }, 1 * 60 * 1000) // 5 minutes
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('⏹️ Stopped automatic status checker')
  }

  async checkAllSessions() {
    try {
      if (!supabaseAdmin.instance) {
        console.error('Supabase admin client not available')
        return
      }

      console.log('🔍 Checking all pending sessions...')

      // Get all sessions that need checking
      const { data: pendingSessions, error: fetchError } = await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select('*')
        .in('status', ['training', 'generating'])

      if (fetchError) {
        console.error('Failed to fetch pending sessions:', fetchError)
        return
      }

      if (!pendingSessions || pendingSessions.length === 0) {
        console.log('✅ No pending sessions to check')
        return
      }

      console.log(`📋 Found ${pendingSessions.length} pending sessions`)

      let updatedCount = 0

      for (const session of pendingSessions) {
        try {
          const updated = await this.checkSession(session)
          if (updated) updatedCount++
        } catch (error) {
          console.error(`❌ Error checking session ${session.id}:`, error)
        }
      }

      console.log(`🎉 Completed status check. Updated ${updatedCount}/${pendingSessions.length} sessions`)

    } catch (error) {
      console.error('❌ Error in checkAllSessions:', error)
    }
  }

  async checkSession(session: any): Promise<boolean> {
    let updated = false
    const updates: any = {}

    // Check training status
    if (session.status === 'training' && session.training_job_id) {
      try {
        console.log(`🔍 Checking training for session ${session.id}`)
        
        const astriaStatus = await AstriaAPI.getTrainingStatus(session.training_job_id)
        const astriaData = astriaStatus as any
        
        if (astriaData.trained_at && !astriaData.failed_at) {
          updates.status = 'ready'
          updates.model_id = astriaStatus.id.toString()
          updated = true
          console.log(`✅ Training completed for session ${session.id}`)
        } else if (astriaData.failed_at) {
          updates.status = 'failed'
          updated = true
          console.log(`❌ Training failed for session ${session.id}`)
        }
      } catch (error) {
        console.error(`Failed to check training status for ${session.id}:`, error)
      }
    }

    // Check generation status
    if (session.status === 'generating' && session.generation_job_id && session.model_id) {
      try {
        console.log(`🔍 Checking generation for session ${session.id}`)
        
        const astriaStatus = await AstriaAPI.getGenerationStatus(
          session.model_id,
          session.generation_job_id
        )
        
        if (astriaStatus.images && astriaStatus.images.length > 0) {
          updates.status = 'completed'
          updated = true
          
          // Update generated images
          await this.updateGeneratedImages(session.id, session.generation_job_id, astriaStatus.images)
          
          console.log(`✅ Generation completed for session ${session.id}`)
        }
      } catch (error) {
        console.error(`Failed to check generation status for ${session.id}:`, error)
      }
    }

    // Update session if needed
    if (updated) {
      updates.updated_at = new Date().toISOString()
      
      await supabaseAdmin.instance!
        .from('photoshoot_sessions')
        .update(updates)
        .eq('id', session.id)
    }

    return updated
  }

  async updateGeneratedImages(sessionId: string, promptId: string, images: any[]) {
    try {
      // Get existing image records
      const { data: existingImages } = await supabaseAdmin.instance!
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
            await supabaseAdmin.instance!
              .from('generated_images')
              .update({
                image_url: imageUrl,
                seed: imageSeed,
                status: 'completed'
              })
              .eq('id', existingImages[i].id)
          } else {
            // Create new record
            await supabaseAdmin.instance!
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

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null
    }
  }
}

// Create singleton instance only when needed
let _statusChecker: StatusChecker | null = null

export const statusChecker = {
  get instance() {
    if (!_statusChecker) {
      _statusChecker = new StatusChecker()
    }
    return _statusChecker
  },
  start() {
    return this.instance.start()
  },
  stop() {
    return this.instance.stop()
  }
}

// Auto-start in production (disabled to prevent build issues)
// if (process.env.NODE_ENV === 'production') {
//   statusChecker.start()
// }
