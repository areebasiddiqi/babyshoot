import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { searchParams } = request.nextUrl
    const configKey = searchParams.get('key')

    if (configKey) {
      // Get specific config
      const { data: config, error } = await supabaseAdmin.instance
        .from('app_config')
        .select('config_value')
        .eq('config_key', configKey)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching app config:', error)
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
      }

      return NextResponse.json(config.config_value)
    } else {
      // Get all public configs as a merged object
      const { data: configs, error } = await supabaseAdmin.instance
        .from('app_config')
        .select('config_key, config_value')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching app configs:', error)
        return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
      }

      // Merge all configs into a single object
      const mergedConfig = configs?.reduce((acc: Record<string, any>, config: any) => {
        if (config.config_key && config.config_value !== undefined) {
          acc[config.config_key] = config.config_value
        }
        return acc
      }, {} as Record<string, string | number | boolean>) || {}

      return NextResponse.json(mergedConfig)
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
