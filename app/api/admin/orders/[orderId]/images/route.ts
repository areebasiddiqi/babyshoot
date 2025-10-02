import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
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

    // Get the order and verify it exists
    console.log('Fetching order:', params.orderId)
    const { data: order, error: orderError } = await supabaseAdmin.instance
      .from('album_orders')
      .select(`
        id,
        album_id,
        albums (
          id,
          title,
          album_images (
            id,
            position,
            generated_images (
              id,
              image_url
            )
          )
        )
      `)
      .eq('id', params.orderId)
      .single()

    console.log('Order query result:', { order, orderError })

    if (orderError || !order) {
      console.error('Order not found or error:', orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Extract and sort images by position
    // Handle both single object and array cases for albums
    const album = Array.isArray(order.albums) ? order.albums[0] : order.albums
    console.log('Album data:', album)
    
    const images = album?.album_images || []
    console.log('Images found:', images.length)
    const sortedImages = images
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((img: any) => img.generated_images?.image_url)
      .filter((url: any) => url) // Remove any null/undefined URLs

    return NextResponse.json({
      orderId: order.id,
      albumId: order.album_id,
      albumTitle: album?.title || 'Untitled Album',
      images: sortedImages,
      totalImages: sortedImages.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
