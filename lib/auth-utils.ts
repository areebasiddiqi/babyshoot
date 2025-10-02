import { User } from '@supabase/supabase-js'
import { supabaseAdmin } from './supabase'

/**
 * Ensures a user exists in the database by upserting their data
 * This is needed because Supabase Auth users might not be synced to our users table yet
 */
export async function ensureUserExists(user: User): Promise<void> {
  if (!supabaseAdmin.instance) {
    throw new Error('Supabase admin client not available')
  }

  await supabaseAdmin.instance
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || '',
      last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
      image_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      updated_at: new Date().toISOString(),
    })
}

/**
 * Creates a free subscription for a new user if they don't have one
 */
export async function ensureUserSubscription(userId: string): Promise<void> {
  if (!supabaseAdmin.instance) {
    throw new Error('Supabase admin client not available')
  }

  const { data: existingSubscription } = await supabaseAdmin.instance
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!existingSubscription) {
    await supabaseAdmin.instance
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: 'free',
        status: 'active',
        photoshoots_used: 0,
        photoshoots_limit: 1,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
  }
}
