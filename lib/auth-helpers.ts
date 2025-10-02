import { supabaseAdmin } from './supabase'

/**
 * Check if a user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!supabaseAdmin.instance) {
    return false
  }

  try {
    const { data: user, error } = await supabaseAdmin.instance
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return user?.role === 'admin' || user?.role === 'super_admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if a user has super admin role
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!supabaseAdmin.instance) {
    return false
  }

  try {
    const { data: user, error } = await supabaseAdmin.instance
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking super admin status:', error)
      return false
    }

    return user?.role === 'super_admin'
  } catch (error) {
    console.error('Error checking super admin status:', error)
    return false
  }
}

/**
 * Get user role
 */
export async function getUserRole(userId: string): Promise<string | null> {
  if (!supabaseAdmin.instance) {
    return null
  }

  try {
    const { data: user, error } = await supabaseAdmin.instance
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error getting user role:', error)
      return null
    }

    return user?.role || 'user'
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

/**
 * Update user role (super admin only)
 */
export async function updateUserRole(userId: string, newRole: string, adminUserId: string): Promise<boolean> {
  if (!supabaseAdmin.instance) {
    return false
  }

  try {
    // Check if the admin user has super admin privileges
    const isSuperAdminUser = await isSuperAdmin(adminUserId)
    if (!isSuperAdminUser) {
      console.error('Only super admins can update user roles')
      return false
    }

    const { error } = await supabaseAdmin.instance
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}
