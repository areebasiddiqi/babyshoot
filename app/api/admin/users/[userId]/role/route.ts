import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/admin-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { role } = await request.json()

    if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Prevent users from removing their own super admin role
    if (session.user.id === params.userId && role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Cannot remove your own super admin privileges' 
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.instance
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', params.userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'User role updated successfully',
      user: data 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
