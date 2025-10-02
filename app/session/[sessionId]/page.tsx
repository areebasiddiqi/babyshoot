'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import SessionView from '@/components/SessionView'
import LoadingSpinner from '@/components/LoadingSpinner'

// Client-side cache for session data
const clientSessionCache = new Map<string, { data: any; timestamp: number }>()
const CLIENT_CACHE_DURATION = 60 * 1000 // 1 minute

export default function SessionPage({ 
  params 
}: { 
  params: { sessionId: string } 
}) {
  const { user } = useAuth()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(false) // Start with false, set to true only if needed
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    const fetchSession = async () => {
      try {
        // Check client-side cache first
        const cacheKey = `${user.id}-${params.sessionId}`
        const cached = clientSessionCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_DURATION) {
          setSession(cached.data)
          setLoading(false)
          return
        }

        // Show loading when we need to fetch fresh data
        setLoading(true)
        
        const response = await fetch(`/api/sessions/${params.sessionId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/dashboard')
            return
          }
          throw new Error('Failed to fetch session')
        }

        const data = await response.json()
        
        // Cache the result
        clientSessionCache.set(cacheKey, {
          data: data.session,
          timestamp: Date.now()
        })
        
        setSession(data.session)
      } catch (err) {
        console.error('Error fetching session:', err)
        setError('Failed to load session details')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [user, params.sessionId, router])

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Loading session details...</h2>
          <p className="text-gray-600">This should only take a moment</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <SessionView session={session} />
}
