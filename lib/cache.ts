import { NextResponse } from 'next/server'

// Simple in-memory cache for API responses
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // Public method to iterate over cache entries for invalidation
  forEach(callback: (value: any, key: string) => void) {
    this.cache.forEach((item, key) => {
      callback(item, key)
    })
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Create cache instance only when needed, not during build
let _apiCache: APICache | null = null

function getCache() {
  if (!_apiCache) {
    _apiCache = new APICache()
  }
  return _apiCache
}

export const apiCache = {
  get(key: string) {
    return getCache().get(key)
  },
  set(key: string, value: any, ttl?: number) {
    return getCache().set(key, value, ttl)
  },
  delete(key: string) {
    return getCache().delete(key)
  },
  cleanup() {
    return getCache().cleanup()
  },
  // Expose forEach method for invalidation
  forEach(callback: (value: any, key: string) => void) {
    return getCache().forEach(callback)
  }
}

// Cleanup expired entries every 5 minutes (only in runtime, not during build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    apiCache.cleanup()
  }, 5 * 60 * 1000)
}

// Cache wrapper for API responses
export function withCache(
  handler: (request: Request, ...args: any[]) => Promise<NextResponse>,
  options: {
    ttl?: number // Time to live in seconds
    keyGenerator?: (request: Request, ...args: any[]) => string
  } = {}
) {
  const { ttl = 300, keyGenerator } = options

  return async (request: Request, ...args: any[]) => {
    // Generate cache key
    const url = new URL(request.url)
    const defaultKey = `${request.method}:${url.pathname}${url.search}`
    const cacheKey = keyGenerator ? keyGenerator(request, ...args) : defaultKey

    // Try to get from cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${ttl}`
        }
      })
    }

    // Execute the handler
    const response = await handler(request, ...args)
    
    // Cache successful responses
    if (response.ok) {
      try {
        const data = await response.clone().json()
        apiCache.set(cacheKey, data, ttl)
      } catch (error) {
        // If response is not JSON, don't cache
        console.warn('Failed to cache non-JSON response:', error)
      }
    }

    // Add cache headers
    const headers = new Headers(response.headers)
    headers.set('X-Cache', 'MISS')
    headers.set('Cache-Control', `public, max-age=${ttl}`)

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  }
}

// Cache invalidation helpers
export const cacheKeys = {
  users: (params?: { page?: number; search?: string; role?: string }) => 
    `users:${JSON.stringify(params || {})}`,
  orders: (params?: { page?: number; search?: string; status?: string }) => 
    `orders:${JSON.stringify(params || {})}`,
  themes: (sessionType?: string) => `themes:${sessionType || 'all'}`,
  children: (userId: string) => `children:${userId}`,
  sessions: (userId: string) => `sessions:${userId}`,
  credits: (userId: string) => `credits:${userId}`,
  appConfig: () => 'app-config'
}

export const invalidateCache = {
  users: () => {
    // Invalidate all user-related cache entries
    const keysToDelete: string[] = []
    apiCache.forEach((value: any, key: string) => {
      if (key.includes('users:')) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => apiCache.delete(key))
  },
  orders: () => {
    const keysToDelete: string[] = []
    apiCache.forEach((value: any, key: string) => {
      if (key.includes('orders:')) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => apiCache.delete(key))
  },
  userSpecific: (userId: string) => {
    const keysToInvalidate = [
      cacheKeys.children(userId),
      cacheKeys.sessions(userId),
      cacheKeys.credits(userId)
    ]
    keysToInvalidate.forEach(key => apiCache.delete(key))
  }
}
