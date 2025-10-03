import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SparklesIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { isAdmin } from '@/lib/admin-utils'
import UserMenu from '@/components/UserMenu'
import ThemeForm from '@/components/admin/ThemeForm'

export default async function NewTheme() {
  const { cookies } = await import('next/headers')
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return redirect('/sign-in')
  }

  const user = session.user
  const hasAdminAccess = await isAdmin(user.id)
  
  if (!hasAdminAccess) {
    return redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="flex items-center space-x-2">
                <SparklesIcon className="h-8 w-8 text-primary-500" />
                <span className="text-xl font-bold gradient-text">Admin</span>
              </Link>
              <div className="hidden sm:block text-gray-300">|</div>
              <h1 className="hidden sm:block text-xl font-semibold text-gray-900">New Theme</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/admin/themes" className="btn-secondary">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Themes
              </Link>
              <UserMenu 
                userEmail={user.email || undefined}
                userName={user.user_metadata?.first_name || user.user_metadata?.name || undefined}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Theme</h2>
          <p className="text-gray-600">Add a new photoshoot theme for users to choose from.</p>
        </div>

        <ThemeForm />
      </div>
    </div>
  )
}
