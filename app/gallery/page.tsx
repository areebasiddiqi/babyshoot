import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  SparklesIcon,
  PhotoIcon,
  ArrowLeftIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '@/lib/supabase'
import GalleryView from '@/components/GalleryView'

async function getUserSessions(userId: string) {
  if (!supabaseAdmin.instance) {
    throw new Error('Supabase admin client not available')
  }

  const { data: sessions, error } = await supabaseAdmin.instance
    .from('photoshoot_sessions')
    .select(`
      *,
      children (name, age_in_months),
      themes (name, description),
      generated_images (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Database error:', error)
    return []
  }

  return sessions || []
}

export default async function GalleryPage() {
  const { cookies } = await import('next/headers')
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/sign-in')
  }

  const user = session.user
  const sessions = await getUserSessions(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="hidden sm:block text-gray-300">|</div>
              <div className="flex items-center space-x-2">
                <PhotoIcon className="h-6 w-6 text-primary-500" />
                <h1 className="text-xl font-semibold text-gray-900">Gallery</h1>
              </div>
            </div>
            
            <Link href="/create" className="btn-primary">
              <SparklesIcon className="h-5 w-5 mr-2" />
              New Photoshoot
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GalleryView sessions={sessions} />
      </div>
    </div>
  )
}
