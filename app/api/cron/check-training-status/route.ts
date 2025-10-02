import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job (optional: add auth header check)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    console.log('🔄 Starting automatic training status check...')

    // Get all sessions that are currently training
    const { data: trainingSessions, error: fetchError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('*')
      .eq('status', 'training')
      .not('training_job_id', 'is', null)

    if (fetchError) {
      console.error('Failed to fetch training sessions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    if (!trainingSessions || trainingSessions.length === 0) {
      console.log('✅ No training sessions to check')
      return NextResponse.json({ 
        message: 'No training sessions to check',
        checked: 0,
        updated: 0
      })
    }

    console.log(`📋 Found ${trainingSessions.length} training sessions to check`)

    let updatedCount = 0
    const results = []

    // Check each training session
    for (const session of trainingSessions) {
      try {
        console.log(`🔍 Checking session ${session.id} with tune ID ${session.training_job_id}`)

        // Check Astria API status
        const astriaStatus = await AstriaAPI.getTrainingStatus(session.training_job_id)
        
        let newStatus = session.status
        let modelId = session.model_id

        // Check if training is completed
        const astriaData = astriaStatus as any
        if (astriaData.trained_at && !astriaData.failed_at) {
          newStatus = 'ready'
          modelId = astriaStatus.id.toString()
          
          console.log(`✅ Session ${session.id} training completed! Updating to ready status`)
          
          // Update database
          const { error: updateError } = await supabaseAdmin.instance
            .from('photoshoot_sessions')
            .update({
              status: newStatus,
              model_id: modelId,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id)

          if (updateError) {
            console.error(`❌ Failed to update session ${session.id}:`, updateError)
            results.push({
              sessionId: session.id,
              status: 'error',
              error: updateError.message
            })
          } else {
            updatedCount++
            results.push({
              sessionId: session.id,
              status: 'updated',
              newStatus: newStatus,
              modelId: modelId
            })
          }

        } else if (astriaData.failed_at) {
          newStatus = 'failed'
          
          console.log(`❌ Session ${session.id} training failed! Updating to failed status`)
          
          // Update database
          const { error: updateError } = await supabaseAdmin.instance
            .from('photoshoot_sessions')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id)

          if (updateError) {
            console.error(`❌ Failed to update session ${session.id}:`, updateError)
            results.push({
              sessionId: session.id,
              status: 'error',
              error: updateError.message
            })
          } else {
            updatedCount++
            results.push({
              sessionId: session.id,
              status: 'updated',
              newStatus: newStatus
            })
          }

        } else {
          // Still training
          console.log(`⏳ Session ${session.id} still training... ETA: ${astriaData.eta || 'unknown'}`)
          results.push({
            sessionId: session.id,
            status: 'still_training',
            eta: astriaData.eta
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

    console.log(`🎉 Completed status check. Updated ${updatedCount}/${trainingSessions.length} sessions`)

    return NextResponse.json({
      message: 'Training status check completed',
      checked: trainingSessions.length,
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
