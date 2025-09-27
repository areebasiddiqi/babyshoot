import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get session type from query parameters
    const { searchParams } = new URL(request.url)
    const sessionType = searchParams.get('sessionType') || 'child'

    let query = supabaseAdmin
      .from('themes')
      .select('*')
      .eq('is_active', true)

    // Filter themes based on session type
    if (sessionType === 'child') {
      query = query.in('session_type', ['child', 'both'])
    } else if (sessionType === 'family') {
      query = query.in('session_type', ['family', 'both'])
    }

    const { data: themes, error } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
    }

    return NextResponse.json(themes)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
