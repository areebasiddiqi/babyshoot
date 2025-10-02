import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Test basic database connection
    const { data: usersTest, error: usersError } = await supabaseAdmin.instance
      .from('users')
      .select('id')
      .limit(1)

    const { data: ordersTest, error: ordersError } = await supabaseAdmin.instance
      .from('album_orders')
      .select('id')
      .limit(1)

    return NextResponse.json({
      status: 'ok',
      database: {
        users: {
          accessible: !usersError,
          error: usersError?.message || null
        },
        orders: {
          accessible: !ordersError,
          error: ordersError?.message || null
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
