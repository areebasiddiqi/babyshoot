import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { themeId, isActive } = await request.json()

    if (!themeId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Theme ID and isActive status are required' }, { status: 400 })
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

    // Update theme status
    const { data: updatedTheme, error } = await supabaseAdmin.instance
      .from('themes')
      .update({ is_active: isActive })
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
