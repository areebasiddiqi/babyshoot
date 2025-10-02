import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// PUT - Update a specific prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: { themeId: string; promptId: string } }
) {
  try {
    const { prompt_text, prompt_order, is_active } = await request.json()

    if (!prompt_text) {
      return NextResponse.json({ error: 'Prompt text is required' }, { status: 400 })
    }

    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin(session.user.id)

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const updateData: any = { prompt_text }
    if (prompt_order !== undefined) updateData.prompt_order = prompt_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedPrompt, error } = await supabaseAdmin.instance
      .from('theme_prompts')
      .update(updateData)
      .eq('id', params.promptId)
      .eq('theme_id', params.themeId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
    }

    if (!updatedPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      prompt: updatedPrompt
    })

  } catch (error: any) {
    console.error('API error:', error)
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a specific prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { themeId: string; promptId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin(session.user.id)

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { error } = await supabaseAdmin.instance
      .from('theme_prompts')
      .delete()
      .eq('id', params.promptId)
      .eq('theme_id', params.themeId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully'
    })

  } catch (error: any) {
    console.error('API error:', error)
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
