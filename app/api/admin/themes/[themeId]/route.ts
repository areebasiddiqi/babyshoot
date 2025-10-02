import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest, { params }: { params: { themeId: string } }) {
  try {
    const { name, description, prompt, category, session_type, is_active } = await request.json()
    const { themeId } = params

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

    // Update theme
    const { data: updatedTheme, error } = await supabaseAdmin.instance
      .from('themes')
      .update({
        name,
        description,
        prompt,
        category,
        session_type,
        is_active: is_active ?? true
      })
      .eq('id', themeId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      theme: updatedTheme
    })

  } catch (error: any) {
    console.error('API error:', error)
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { themeId: string } }) {
  try {
    const { themeId } = params

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

    // Soft delete by setting is_active to false
    const { data: deletedTheme, error } = await supabaseAdmin.instance
      .from('themes')
      .update({ is_active: false })
      .eq('id', themeId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete theme' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      theme: deletedTheme
    })

  } catch (error: any) {
    console.error('API error:', error)
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
