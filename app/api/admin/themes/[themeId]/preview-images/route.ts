import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { themeId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAdminAccess = await isAdmin(session.user.id)
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { data: theme, error } = await supabaseAdmin.instance
      .from('themes')
      .select('id, name, preview_images')
      .eq('id', params.themeId)
      .single()

    if (error || !theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    return NextResponse.json({
      themeId: theme.id,
      themeName: theme.name,
      previewImages: theme.preview_images || []
    })
  } catch (error) {
    console.error('Get preview images error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { themeId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAdminAccess = await isAdmin(session.user.id)
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { previewImages } = await request.json()

    // Validate that previewImages is an array of strings
    if (!Array.isArray(previewImages) || !previewImages.every(img => typeof img === 'string')) {
      return NextResponse.json({ error: 'Invalid preview images format' }, { status: 400 })
    }

    // Limit to maximum 10 preview images
    if (previewImages.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 preview images allowed' }, { status: 400 })
    }

    // Validate URLs (basic validation)
    const urlPattern = /^https?:\/\/.+/
    for (const imageUrl of previewImages) {
      if (!urlPattern.test(imageUrl)) {
        return NextResponse.json({ error: `Invalid URL format: ${imageUrl}` }, { status: 400 })
      }
    }

    const { data: theme, error } = await supabaseAdmin.instance
      .from('themes')
      .update({ 
        preview_images: previewImages
      })
      .eq('id', params.themeId)
      .select('id, name, preview_images')
      .single()

    if (error) {
      console.error('Update preview images error:', error)
      return NextResponse.json({ error: 'Failed to update preview images' }, { status: 500 })
    }

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Preview images updated successfully',
      themeId: theme.id,
      themeName: theme.name,
      previewImages: theme.preview_images || []
    })
  } catch (error) {
    console.error('Update preview images error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
