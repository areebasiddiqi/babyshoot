import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get session type from query parameters
    const sessionType = request.nextUrl.searchParams.get('sessionType') || 'child'

    let query = supabaseAdmin.instance
      .from('themes')
      .select(`
        *,
        theme_prompts (
          id,
          prompt_text,
          prompt_order,
          is_active
        )
      `)
      .eq('is_active', true)

    // Filter themes based on session type
    if (sessionType === 'child') {
      query = query.in('session_type', ['child', 'both'])
    } else if (sessionType === 'family') {
      query = query.in('session_type', ['family', 'both'])
    }

    const { data: themes, error } = await query
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
    }

    // Transform the data to group prompts by theme
    const transformedThemes = themes?.map((theme: any) => {
      const { theme_prompts, ...themeData } = theme
      
      // Handle themes with prompts
      if (theme_prompts && Array.isArray(theme_prompts)) {
        const activePrompts = theme_prompts
          .filter((prompt: any) => prompt.is_active)
          .sort((a: any, b: any) => a.prompt_order - b.prompt_order)
        
        return {
          ...themeData,
          prompts: activePrompts
        }
      }
      
      // Handle themes without prompts (backward compatibility)
      return {
        ...themeData,
        prompts: []
      }
    }) || []

    return NextResponse.json(transformedThemes)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
