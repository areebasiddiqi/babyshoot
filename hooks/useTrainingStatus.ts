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

    // Don't check if already completed or failed
    if (photoshootStatus.status === 'completed' || photoshootStatus.status === 'failed') {
      return
    }

    setIsChecking(true)
    setError(null)

    try {
      // Use the auto-update endpoint that handles both training and generation
      const response = await fetch(`/api/photoshoot/${sessionId}/auto-update`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        
        setPhotoshootStatus(prev => ({
          ...prev,
          status: data.session.status,
          modelId: data.session.model_id,
          images: data.images,
          message: data.updated ? 'Status updated automatically' : undefined
        }))

        if (data.updated) {
          console.log('Status automatically updated:', data.updates)
        }
      }

    } catch (err: any) {
      console.error('Failed to check photoshoot status:', err)
      setError(err.message)
    } finally {
      setIsChecking(false)
    }
  }, [sessionId, photoshootStatus.status])

  // Auto-check status based on current state
  useEffect(() => {
    if (!sessionId) return

    // Don't poll if completed or failed
    if (photoshootStatus.status === 'completed' || photoshootStatus.status === 'failed') {
      return
    }

    // Check immediately
    checkStatus()

    // Set different polling intervals based on status
    let interval: NodeJS.Timeout
    
    if (photoshootStatus.status === 'training') {
      // Check every 30 seconds for training (slower process)
      interval = setInterval(checkStatus, 30000)
    } else if (photoshootStatus.status === 'generating') {
      // Check every 10 seconds for generation (faster process)
      interval = setInterval(checkStatus, 10000)
    } else {
      // Check every 5 seconds for other states
      interval = setInterval(checkStatus, 5000)
    }

    return () => clearInterval(interval)
  }, [sessionId, checkStatus, photoshootStatus.status])

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
