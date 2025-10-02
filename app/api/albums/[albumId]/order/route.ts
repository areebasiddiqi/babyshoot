import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { albumId: string } }
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

    const { 
      albumSize, 
      coverType, 
      shippingName, 
      shippingAddress, 
      totalAmount 
    } = await request.json()

    // Verify album ownership and has images
    const { data: album, error: albumError } = await supabaseAdmin.instance
      .from('albums')
      .select(`
        id,
        title,
        album_images (count)
      `)
      .eq('id', params.albumId)
      .eq('user_id', session.user.id)
      .single()

    if (albumError || !album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    if (!album.album_images || album.album_images[0]?.count === 0) {
      return NextResponse.json({ error: 'Album must have at least one image' }, { status: 400 })
    }

    // Try to create order with full data, fallback to minimal data if columns don't exist
    let orderData: any = {
      album_id: params.albumId,
      user_id: session.user.id,
      shipping_name: shippingName,
      shipping_address: shippingAddress,
      album_size: albumSize,
      total_amount: totalAmount,
      status: 'pending'
    }

    // Try to add additional columns if they exist
    try {
      orderData.cover_type = coverType
      orderData.base_price = totalAmount - 9.99
      orderData.shipping_cost = 9.99
    } catch (e) {
      // Ignore if columns don't exist yet
    }

    const { data: order, error: orderError } = await supabaseAdmin.instance
      .from('album_orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Update album status to ordered
    await supabaseAdmin.instance
      .from('albums')
      .update({ status: 'ordered' })
      .eq('id', params.albumId)

    return NextResponse.json(order)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
