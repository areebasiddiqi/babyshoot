import { User } from '@supabase/supabase-js'
import { supabaseAdmin } from './supabase'

export type UserRole = 'user' | 'admin' | 'super_admin'

/**
 * Check if a user has admin privileges
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!supabaseAdmin.instance) return false

  const { data: user } = await supabaseAdmin.instance
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'admin' || user?.role === 'super_admin'
}

/**
 * Check if a user has super admin privileges
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!supabaseAdmin.instance) return false

  const { data: user } = await supabaseAdmin.instance
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'super_admin'
}

/**
 * Get user role
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  if (!supabaseAdmin.instance) return 'user'

  const { data: user } = await supabaseAdmin.instance
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role || 'user'
}

/**
 * Update user role (super admin only)
 */
export async function updateUserRole(adminUserId: string, targetUserId: string, newRole: UserRole): Promise<boolean> {
  if (!supabaseAdmin.instance) return false

  // Check if admin has super admin privileges
  const adminIsSuperAdmin = await isSuperAdmin(adminUserId)
  if (!adminIsSuperAdmin) return false

  const { error } = await supabaseAdmin.instance
    .from('users')
    .update({ role: newRole })
    .eq('id', targetUserId)

  return !error
}

/**
 * Middleware to check admin access
 */
export async function requireAdmin(userId: string): Promise<void> {
  const hasAccess = await isAdmin(userId)
  if (!hasAccess) {
    throw new Error('Admin access required')
  }
}

/**
 * Middleware to check super admin access
 */
export async function requireSuperAdmin(userId: string): Promise<void> {
  const hasAccess = await isSuperAdmin(userId)
  if (!hasAccess) {
    throw new Error('Super admin access required')
  }
}
