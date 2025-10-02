'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useCreditBalance } from '@/contexts/CreditContext'

interface UsePaymentStatusProps {
  paymentIntentId?: string
  onPaymentSuccess?: () => void
}

export function usePaymentStatus({ paymentIntentId, onPaymentSuccess }: UsePaymentStatusProps) {
  const { refreshBalance } = useCreditBalance()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasSucceededRef = useRef(false)

  useEffect(() => {
    if (!paymentIntentId || hasSucceededRef.current) {
      return
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/stripe/payment-status/${paymentIntentId}`)
        if (response.ok) {
          const data = await response.json()
          
          if (data.status === 'succeeded' && !hasSucceededRef.current) {
            hasSucceededRef.current = true
            
            // Dismiss loading toast
            toast.dismiss('payment-processing')
            
            // Refresh credit balance
            await refreshBalance()
            
            // Call success callback
            onPaymentSuccess?.()
            
            // Clear the interval
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
    }

    // Check immediately
    checkPaymentStatus()

    // Set up polling every 2 seconds for up to 2 minutes
    intervalRef.current = setInterval(checkPaymentStatus, 2000)

    // Clear after 2 minutes to avoid infinite polling
    const timeout = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 120000) // 2 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      clearTimeout(timeout)
    }
  }, [paymentIntentId, refreshBalance, onPaymentSuccess])

  return {
    cleanup: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }
}
