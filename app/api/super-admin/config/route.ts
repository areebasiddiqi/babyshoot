import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth-helpers'

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

    // Check if user is super admin
    const hasAccess = await isSuperAdmin(session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    // Get all app configuration
    const { data: configs, error } = await supabaseAdmin.instance
      .from('app_config')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) {
      console.error('Error fetching app config:', error)
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
    }

    return NextResponse.json(configs || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    // Check if user is super admin
    const hasAccess = await isSuperAdmin(session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { config_key, config_value, description } = await request.json()

    if (!config_key || !config_value) {
      return NextResponse.json({ error: 'config_key and config_value are required' }, { status: 400 })
    }

    // Update configuration using upsert with onConflict
    const { data, error } = await supabaseAdmin.instance
      .from('app_config')
      .upsert({
        config_key,
        config_value,
        description,
        updated_by: session.user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'config_key'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating app config:', error)
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
