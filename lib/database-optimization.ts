import { supabaseAdmin } from './supabase'

// Database query optimization utilities
export class DatabaseOptimizer {
  
  // Batch database operations to reduce round trips
  static async batchQuery<T>(
    queries: Array<() => Promise<T>>
  ): Promise<T[]> {
    return Promise.all(queries.map(query => query()))
  }

  // Optimized user data fetching with minimal queries
  static async getUserDashboardData(userId: string) {
    if (!supabaseAdmin.instance) {
      throw new Error('Supabase admin client not available')
    }

    // Single query to get all user-related data
    const [
      { data: children },
      { data: sessions },
      { data: creditBalance },
      { count: totalSessions },
      { count: thisMonthSessions }
    ] = await Promise.all([
      // Get user's children
      supabaseAdmin.instance
        .from('children')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Get user's sessions with related data
      supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select(`
          *,
          children (name),
          themes (name, description),
          generated_images (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10), // Limit to recent sessions for performance

      // Get credit balance
      supabaseAdmin.instance.rpc('get_user_credit_balance', {
        user_uuid: userId
      }),

      // Get total sessions count
      supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Get this month's sessions count
      supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ])

    return {
      children: children || [],
      sessions: sessions || [],
      creditBalance: creditBalance || 0,
      usage: {
        totalSessions: totalSessions || 0,
        thisMonthSessions: thisMonthSessions || 0
      }
    }
  }

  // Optimized admin queries with proper indexing hints
  static async getAdminUsersOptimized(params: {
    page: number
    limit: number
    search?: string
    role?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    if (!supabaseAdmin.instance) {
      throw new Error('Supabase admin client not available')
    }

    const { page, limit, search, role, sortBy = 'created_at', sortOrder = 'desc' } = params
    const offset = (page - 1) * limit

    let query = supabaseAdmin.instance
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        created_at,
        updated_at,
        last_sign_in_at
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq('role', role)
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    return query
  }

  // Optimized orders query with joins
  static async getAdminOrdersOptimized(params: {
    page: number
    limit: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    if (!supabaseAdmin.instance) {
      throw new Error('Supabase admin client not available')
    }

    const { page, limit, search, status, sortBy = 'created_at', sortOrder = 'desc' } = params
    const offset = (page - 1) * limit

    let query = supabaseAdmin.instance
      .from('album_orders')
      .select(`
        *,
        albums!inner (
          id,
          title,
          album_images (count)
        ),
        users!inner (
          email,
          first_name,
          last_name
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`users.email.ilike.%${search}%,users.first_name.ilike.%${search}%,users.last_name.ilike.%${search}%,albums.title.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    return query
  }

  // Connection pooling helper
  static async withConnection<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      console.error('Database operation failed:', error)
      throw error
    }
  }

  // Query result caching
  static queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  static async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.queryCache.get(key)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data
    }

    const result = await queryFn()
    this.queryCache.set(key, {
      data: result,
      timestamp: now,
      ttl: ttlSeconds * 1000
    })

    return result
  }

  // Cleanup expired cache entries
  static cleanupCache() {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.queryCache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.queryCache.delete(key))
  }
}

// Cleanup cache every 5 minutes (only in runtime, not during build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    DatabaseOptimizer.cleanupCache()
  }, 5 * 60 * 1000)
}

// Database indexes recommendations (to be run in Supabase SQL editor)
export const RECOMMENDED_INDEXES = `
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', coalesce(email, '') || ' ' || coalesce(first_name, '') || ' ' || coalesce(last_name, '')));

-- Photoshoot sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON photoshoot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_child_id ON photoshoot_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON photoshoot_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON photoshoot_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON photoshoot_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_model_reuse ON photoshoot_sessions(child_id, status, model_id, updated_at) WHERE model_id IS NOT NULL;

-- Album orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON album_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON album_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON album_orders(created_at DESC);

-- Generated images indexes
CREATE INDEX IF NOT EXISTS idx_images_session_id ON generated_images(session_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON generated_images(status);

-- Children indexes
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_children_created_at ON children(created_at DESC);

-- Themes indexes
CREATE INDEX IF NOT EXISTS idx_themes_session_type ON themes(session_type);
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(is_active) WHERE is_active = true;
`
