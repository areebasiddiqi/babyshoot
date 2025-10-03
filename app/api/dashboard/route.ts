import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    if (!supabaseAdmin.instance) {
      throw new Error('Supabase admin client not available - check SUPABASE_SERVICE_ROLE_KEY')
    }

    // Get user's children
    const { data: children } = await supabaseAdmin.instance
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Get user's sessions
    const { data: sessions } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select(`
        *,
        children (name),
        themes (name, description),
        generated_images (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Get user's credit balance
    const { data: creditBalance } = await supabaseAdmin.instance.rpc('get_user_credit_balance', {
      user_uuid: userId
    })

    // Get usage statistics
    const { count: totalSessions } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get this month's sessions
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: thisMonthSessions } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    return NextResponse.json({
      children: children || [],
      sessions: sessions || [],
      creditBalance: creditBalance || 0,
      usage: {
        totalSessions: totalSessions || 0,
        thisMonthSessions: thisMonthSessions || 0
      }
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
