import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import SessionView from '@/components/SessionView'

async function getSession(sessionId: string, userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  const { data: session, error } = await supabaseAdmin
    .from('photoshoot_sessions')
    .select(`
      *,
      children (name, age_in_months, gender),
      themes (name, description),
      generated_images (*)
    `)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (error || !session) {
    return null
  }

  return session
}

export default async function SessionPage({ 
  params 
}: { 
  params: { sessionId: string } 
}) {
  const { cookies } = await import('next/headers')
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createServerComponentClient({ cookies })
  const { data: { session: authSession } } = await supabase.auth.getSession()
  
  if (!authSession) {
    redirect('/sign-in')
  }

  const user = authSession.user
  const session = await getSession(params.sessionId, user.id)

  if (!session) {
    redirect('/dashboard')
  }

  return <SessionView session={session} />
}
