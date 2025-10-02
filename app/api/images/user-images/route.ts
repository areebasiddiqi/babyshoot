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

    // Get all completed images for the user
    const { data: images, error } = await supabaseAdmin.instance
      .from('generated_images')
      .select(`
        id,
        image_url,
        prompt,
        photoshoot_sessions!inner (
          id,
          user_id,
          themes (name),
          children (name)
        )
      `)
      .eq('status', 'completed')
      .eq('photoshoot_sessions.user_id', session.user.id)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user images:', error)
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    return NextResponse.json(images || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
