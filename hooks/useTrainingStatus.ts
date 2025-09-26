import { useState, useEffect, useCallback } from 'react'

interface TrainingStatus {
  status: 'training' | 'ready' | 'failed' | 'completed'
  modelId?: string
  eta?: string
  message?: string
}

export function useTrainingStatus(sessionId: string | null, initialStatus: string = 'training') {
  const [status, setStatus] = useState<TrainingStatus>({ status: initialStatus as any })
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    if (!sessionId || status.status === 'ready' || status.status === 'failed') {
      return
    }

    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch(`/api/photoshoot/${sessionId}/status`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to check status')
      }

      const data = await response.json()
      
      setStatus({
        status: data.status,
        modelId: data.model_id,
        eta: data.eta,
        message: data.message
      })

      console.log('Training status updated:', data)

    } catch (err: any) {
      console.error('Failed to check training status:', err)
      setError(err.message)
    } finally {
      setIsChecking(false)
    }
  }, [sessionId, status.status])

  // Auto-check status every 30 seconds if still training
  useEffect(() => {
    if (!sessionId || status.status === 'ready' || status.status === 'failed') {
      return
    }

    // Check immediately
    checkStatus()

    // Then check every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [sessionId, checkStatus, status.status])

  return {
    status: status.status,
    modelId: status.modelId,
    eta: status.eta,
    message: status.message,
    isChecking,
    error,
    checkStatus
  }
}
