import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
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
    const hasAdminAccess = await isAdmin(session.user.id)
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { status } = await request.json()

    // Validate status
    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update order status
    const { data: order, error } = await supabaseAdmin.instance
      .from('album_orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.orderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating order status:', error)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    // Also update album status based on order status
    if (status === 'shipped') {
      await supabaseAdmin.instance
        .from('albums')
        .update({ status: 'shipped' })
        .eq('id', order.album_id)
    } else if (status === 'delivered') {
      await supabaseAdmin.instance
        .from('albums')
        .update({ status: 'delivered' })
        .eq('id', order.album_id)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
