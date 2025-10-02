import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
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

    const { data: album, error } = await supabaseAdmin.instance
      .from('albums')
      .select(`
        *,
        album_images (
          id,
          position,
          generated_images (id, image_url, prompt)
        )
      `)
      .eq('id', params.albumId)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    return NextResponse.json(album)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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

    const { title, description } = await request.json()

    const { data: album, error } = await supabaseAdmin.instance
      .from('albums')
      .update({ title, description, updated_at: new Date().toISOString() })
      .eq('id', params.albumId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update album' }, { status: 500 })
    }

    return NextResponse.json(album)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
