import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Fetch all prompts for a theme
export async function GET(
  request: NextRequest,
  { params }: { params: { themeId: string } }
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

    const { data: prompts, error } = await supabaseAdmin.instance
      .from('theme_prompts')
      .select('*')
      .eq('theme_id', params.themeId)
      .order('prompt_order', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
    }

    return NextResponse.json(prompts)

  } catch (error: any) {
    console.error('API error:', error)
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new prompt for a theme
export async function POST(
  request: NextRequest,
  { params }: { params: { themeId: string } }
) {
  try {
    const { prompt_text, prompt_order } = await request.json()

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

    // If no order specified, get the next available order
    let finalOrder = prompt_order
    if (!finalOrder) {
      const { data: maxOrderResult } = await supabaseAdmin.instance
        .from('theme_prompts')
        .select('prompt_order')
        .eq('theme_id', params.themeId)
        .order('prompt_order', { ascending: false })
        .limit(1)

      finalOrder = maxOrderResult && maxOrderResult.length > 0 
        ? maxOrderResult[0].prompt_order + 1 
        : 1
    }

    const { data: newPrompt, error } = await supabaseAdmin.instance
      .from('theme_prompts')
      .insert({
        theme_id: params.themeId,
        prompt_text,
        prompt_order: finalOrder,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      prompt: newPrompt
    })

  } catch (error: any) {
    console.error('API error:', error)
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update theme image count
export async function PUT(
  request: NextRequest,
  { params }: { params: { themeId: string } }
) {
  try {
    const { image_count } = await request.json()

    if (!image_count || image_count < 1 || image_count > 20) {
      return NextResponse.json({ 
        error: 'Image count must be between 1 and 20' 
      }, { status: 400 })
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

    const { data: updatedTheme, error } = await supabaseAdmin.instance
      .from('themes')
      .update({ image_count })
      .eq('id', params.themeId)
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
