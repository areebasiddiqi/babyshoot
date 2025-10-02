import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, description, prompt, category, session_type, is_active } = await request.json()

    if (!name || !description || !prompt || !category || !session_type) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 })
    }

    // Get the authenticated user
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    await requireAdmin(session.user.id)

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Create new theme
    const { data: newTheme, error } = await supabaseAdmin.instance
      .from('themes')
      .insert({
        name,
        description,
        prompt,
        category,
        session_type,
        is_active: is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      theme: newTheme
    })

  } catch (error: any) {
    console.error('API error:', error)
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
