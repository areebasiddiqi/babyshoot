import { useState, useEffect, useCallback } from 'react'

interface PhotoshootStatus {
  status: 'pending' | 'training' | 'ready' | 'generating' | 'completed' | 'failed'
  modelId?: string
  eta?: string
  message?: string
  images?: Array<{
    id: string
    image_url: string
    status: string
  }>
}

export function usePhotoshootStatus(sessionId: string | null, initialStatus: string = 'pending') {
  const [photoshootStatus, setPhotoshootStatus] = useState<PhotoshootStatus>({ 
    status: initialStatus as any 
  })
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    if (!sessionId) return

    console.log(`🔍 Checking status for session ${sessionId}`)
    setIsChecking(true)
    setError(null)

    try {
      const endpoint = `/api/photoshoot/${sessionId}/auto-update`
      console.log(`🌐 Making request to: ${endpoint}`)
      
      // Use the auto-update endpoint that handles both training and generation
      const response = await fetch(endpoint, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`📊 Status check response:`, data)
        
        setPhotoshootStatus(prev => {
          // Don't update if already completed or failed
          if (prev.status === 'completed' || prev.status === 'failed') {
            return prev
          }
          
          return {
            ...prev,
            status: data.session.status,
            modelId: data.session.model_id,
            images: data.images,
            message: data.updated ? 'Status updated automatically' : 'Status checked'
          }
        })

        if (data.updated) {
          console.log('✅ Status automatically updated:', data.status)
        }
      } else {
        console.error('❌ Status check failed:', response.status, response.statusText)
      }

    } catch (err: any) {
      console.error('❌ Failed to check photoshoot status:', err)
      setError(err.message)
    } finally {
      setIsChecking(false)
    }
  }, [sessionId])

  // Auto-check status based on current state
  useEffect(() => {
    if (!sessionId) return

    // Check immediately
    checkStatus()

    // Set up polling interval
    const interval = setInterval(() => {
      // Check current status before polling
      setPhotoshootStatus(currentStatus => {
        // Don't poll if completed or failed
        if (currentStatus.status === 'completed' || currentStatus.status === 'failed') {
          console.log(`⏹️ Stopping polling for session ${sessionId} - status: ${currentStatus.status}`)
          return currentStatus
        }
        
        // Continue polling
        console.log(`⏰ Polling interval triggered for session ${sessionId}`)
        checkStatus()
        return currentStatus
      })
    }, 60000) // Every minute

    console.log(`🔄 Started polling for session ${sessionId}`)

    return () => {
      console.log(`🛑 Stopped polling for session ${sessionId}`)
      clearInterval(interval)
    }
  }, [sessionId, checkStatus])

  return {
    status: photoshootStatus.status,
    modelId: photoshootStatus.modelId,
    eta: photoshootStatus.eta,
    message: photoshootStatus.message,
    images: photoshootStatus.images,
    isChecking,
    error,
    checkStatus,
    // Helper methods
    isTraining: photoshootStatus.status === 'training',
    isReady: photoshootStatus.status === 'ready',
    isGenerating: photoshootStatus.status === 'generating',
    isCompleted: photoshootStatus.status === 'completed',
    isFailed: photoshootStatus.status === 'failed'
  }
}
