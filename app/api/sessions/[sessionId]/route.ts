import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Simple in-memory cache for session data
const sessionCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const cacheKey = `${user.id}-${params.sessionId}`

    // Check cache first
    const cached = sessionCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const response = NextResponse.json({ session: cached.data })
      response.headers.set('Cache-Control', 'private, max-age=30')
      return response
    }

    // Fetch the session with optimized query
    const { data: sessionData, error } = await supabase
      .from('photoshoot_sessions')
      .select(`
        *,
        children (name, age_in_months, gender),
        themes (name, description),
        generated_images (*)
      `)
      .eq('id', params.sessionId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
    }

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Cache the result
    sessionCache.set(cacheKey, {
      data: sessionData,
      timestamp: Date.now()
    })

    // Clean up old cache entries periodically
    if (sessionCache.size > 100) {
      const now = Date.now()
      const keysToDelete: string[] = []
      sessionCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_DURATION) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach(key => sessionCache.delete(key))
    }

    const response = NextResponse.json({ session: sessionData })
    response.headers.set('Cache-Control', 'private, max-age=30')
    return response
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
