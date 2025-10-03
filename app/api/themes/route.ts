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
        id,
        name,
        description,
        prompt,
        thumbnail_url,
        category,
        session_type,
        is_active,
        created_at,
        preview_images,
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
      
      // Debug: Log what we're getting from the database
      console.log(`Theme ${theme.name}:`)
      console.log('  - preview_images:', theme.preview_images)
      console.log('  - preview_images type:', typeof theme.preview_images)
      console.log('  - is array:', Array.isArray(theme.preview_images))
      console.log('  - length:', theme.preview_images?.length)
      
      // Use preview_images from database, fallback to sample images if empty or undefined
      const hasValidPreviewImages = theme.preview_images && Array.isArray(theme.preview_images) && theme.preview_images.length > 0
      console.log('  - hasValidPreviewImages:', hasValidPreviewImages)
      
      const previewImages = hasValidPreviewImages
        ? theme.preview_images 
        : [
            `https://picsum.photos/400/600?random=${theme.id}1`,
            `https://picsum.photos/400/600?random=${theme.id}2`,
            `https://picsum.photos/400/600?random=${theme.id}3`,
            `https://picsum.photos/400/600?random=${theme.id}4`,
            `https://picsum.photos/400/600?random=${theme.id}5`
          ]
      
      console.log('  - final previewImages:', previewImages)
      
      // Handle themes with prompts
      if (theme_prompts && Array.isArray(theme_prompts)) {
        const activePrompts = theme_prompts
          .filter((prompt: any) => prompt.is_active)
          .sort((a: any, b: any) => a.prompt_order - b.prompt_order)
        
        return {
          ...themeData,
          prompts: activePrompts,
          previewImages: previewImages
        }
      }
      
      // Handle themes without prompts (backward compatibility)
      return {
        ...themeData,
        prompts: [],
        previewImages: previewImages
      }
    }) || []

    return NextResponse.json(transformedThemes)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
