import { redirect } from 'next/navigation'
import { 
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin-utils'
import DashboardContent from '@/components/DashboardContent'

async function getUserData(userId: string) {
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

  return { 
    children, 
    sessions, 
    creditBalance: creditBalance || 0,
    usage: {
      totalSessions: totalSessions || 0,
      thisMonthSessions: thisMonthSessions || 0
    }
  }
}

export default async function DashboardPage() {
  const { cookies } = await import('next/headers')
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/sign-in')
  }

  const user = session.user
  const { children, sessions, creditBalance, usage } = await getUserData(user.id)
  const hasAdminAccess = await isAdmin(user.id)


  return (
    <DashboardContent
      user={user}
      creditBalance={creditBalance}
      hasAdminAccess={hasAdminAccess}
      children={children || []}
      sessions={sessions || []}
    />
  )
}
