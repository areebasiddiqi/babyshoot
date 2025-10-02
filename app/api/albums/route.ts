import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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

    // Get user's albums with image count
    const { data: albums, error } = await supabaseAdmin.instance
      .from('albums')
      .select(`
        *,
        album_images (count)
      `)
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching albums:', error)
      return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 })
    }

    return NextResponse.json(albums)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data: album, error } = await supabaseAdmin.instance
      .from('albums')
      .insert({
        user_id: session.user.id,
        title,
        description: description || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating album:', error)
      return NextResponse.json({ error: 'Failed to create album' }, { status: 500 })
    }

    return NextResponse.json(album)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
