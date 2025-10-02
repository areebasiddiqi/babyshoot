import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { updateUserRole, requireSuperAdmin, UserRole } from '@/lib/admin-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get the authenticated user
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check super admin permissions (only super admins can change roles)
    await requireSuperAdmin(session.user.id)

    // Prevent users from demoting themselves
    if (session.user.id === userId && role !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot change your own role to a lower level' }, { status: 400 })
    }

    // Update the user role
    const success = await updateUserRole(session.user.id, userId, role as UserRole)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully'
    })

  } catch (error: any) {
    console.error('API error:', error)
    
    if (error.message === 'Super admin access required') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
