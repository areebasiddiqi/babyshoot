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

    const { imageIds } = await request.json()

    if (!imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json({ error: 'Image IDs are required' }, { status: 400 })
    }

    // Verify album ownership
    const { data: album } = await supabaseAdmin.instance
      .from('albums')
      .select('id')
      .eq('id', params.albumId)
      .eq('user_id', session.user.id)
      .single()

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // Get current max position
    const { data: maxPos } = await supabaseAdmin.instance
      .from('album_images')
      .select('position')
      .eq('album_id', params.albumId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    let nextPosition = (maxPos?.position || 0) + 1

    // Add images to album
    const albumImages = imageIds.map((imageId: string) => ({
      album_id: params.albumId,
      image_id: imageId,
      position: nextPosition++
    }))

    const { data: addedImages, error } = await supabaseAdmin.instance
      .from('album_images')
      .insert(albumImages)
      .select()

    if (error) {
      console.error('Error adding images to album:', error)
      return NextResponse.json({ error: 'Failed to add images' }, { status: 500 })
    }

    return NextResponse.json(addedImages)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { searchParams } = request.nextUrl
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.instance
      .from('album_images')
      .delete()
      .eq('album_id', params.albumId)
      .eq('image_id', imageId)

    if (error) {
      return NextResponse.json({ error: 'Failed to remove image' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
