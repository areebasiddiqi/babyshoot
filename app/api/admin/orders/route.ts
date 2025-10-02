import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth-helpers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface Order {
  id: string
  status: string
  total_amount: number
  shipping_address: any
  created_at: string
  updated_at: string
  albums?: {
    id: string
    user_id: string
    title: string
    status: string
  }
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
}

interface OrderWithUser extends Order {
  users?: {
    email: string
    first_name: string
    last_name: string
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const hasAccess = await isAdmin(session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build query - First let's get orders with album info, then join user data separately
    let query = supabaseAdmin.instance
      .from('album_orders')
      .select(`
        *,
        albums (
          id,
          title,
          user_id,
          album_images (count)
        )
      `, { count: 'exact' })

    // Apply search filter (album title only - user search will be done post-fetch)
    if (search) {
      query = query.filter('albums.title', 'ilike', `%${search}%`)
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Get unique user IDs from orders
    const userIds = Array.from(new Set(
      (orders as Order[] || [])
        .map((order: Order) => order.albums?.user_id)
        .filter(Boolean)
    ))

    // Batch fetch all user data
    let usersMap = new Map<string, User>()
    if (userIds.length > 0) {
      try {
        const { data: usersData } = await supabaseAdmin.instance
          .from('users')
          .select('id, email, first_name, last_name')
          .in('id', userIds)
        
        if (usersData) {
          usersData.forEach((user: User) => {
            usersMap.set(user.id, user)
          })
        }
      } catch (error) {
        console.warn('Failed to batch fetch user data:', error)
      }
    }

    // Map orders with user data
    let ordersWithUsers = (orders as Order[] || []).map((order: Order) => {
      const userId = order.albums?.user_id
      const userData = userId ? usersMap.get(userId) : null
      
      return {
        ...order,
        users: userData || { 
          email: 'Unknown User', 
          first_name: 'Unknown', 
          last_name: '' 
        }
      }
    })

    // Apply search filter to user data if search term exists
    if (search) {
      const searchLower = search.toLowerCase()
      ordersWithUsers = ordersWithUsers.filter((order: OrderWithUser) => {
        const albumMatch = order.albums?.title?.toLowerCase().includes(searchLower)
        const emailMatch = order.users?.email?.toLowerCase().includes(searchLower)
        const nameMatch = 
          order.users?.first_name?.toLowerCase().includes(searchLower) ||
          order.users?.last_name?.toLowerCase().includes(searchLower)
        
        return albumMatch || emailMatch || nameMatch
      })
    }

    // Update count based on filtered results if search was applied
    const finalCount = search ? ordersWithUsers.length : (count || 0)
    const totalPages = Math.ceil(finalCount / limit)

    return NextResponse.json({
      orders: ordersWithUsers,
      pagination: {
        page,
        limit,
        total: finalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search,
        status,
        sortBy,
        sortOrder
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
