import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  SparklesIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin-utils'
import UserMenu from '@/components/UserMenu'
import ThemeToggle from '@/components/admin/ThemeToggle'
import ThemePromptsManagerWrapper from '@/components/admin/ThemePromptsManagerWrapper'

interface Theme {
  id: string
  name: string
  description: string
  category: string
  is_active: boolean
  session_type: 'child' | 'family' | 'both'
  image_count?: number
  created_at: string
  updated_at: string
}

async function getThemes(): Promise<Theme[]> {
  if (!supabaseAdmin.instance) {
    throw new Error('Supabase admin client not available')
  }

  const { data: themes } = await supabaseAdmin.instance
    .from('themes')
    .select('*')
    .order('created_at', { ascending: false })

  return (themes as Theme[]) || []
}

export default async function ThemeManagement() {
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

  const themes = await getThemes()

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
              <h1 className="hidden sm:block text-xl font-semibold text-gray-900">Theme Management</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="btn-secondary">
                Back to Admin
              </Link>
              <UserMenu 
                userEmail={user.email || undefined}
                userName={user.user_metadata?.first_name || user.user_metadata?.name || undefined}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Theme Management</h2>
            <p className="text-gray-600">Create and manage photoshoot themes for users.</p>
          </div>
          <Link href="/admin/themes/new" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Theme
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-900">{themes.length}</p>
              <p className="text-sm text-gray-600">Total Themes</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{themes.filter((t: Theme) => t.is_active).length}</p>
              <p className="text-sm text-gray-600">Active Themes</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{themes.filter((t: Theme) => t.session_type === 'child').length}</p>
              <p className="text-sm text-gray-600">Child Themes</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{themes.filter((t: Theme) => t.session_type === 'family').length}</p>
              <p className="text-sm text-gray-600">Family Themes</p>
            </div>
          </div>
        </div>

        {/* Themes Grid */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Theme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {themes.map((theme: Theme) => (
                  <tr key={theme.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center mr-4">
                          <SparklesIcon className="h-6 w-6 text-primary-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                          <div className="text-sm text-gray-500">{theme.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {theme.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        theme.session_type === 'child' ? 'bg-blue-100 text-blue-800' :
                        theme.session_type === 'family' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {theme.session_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ThemeToggle themeId={theme.id} isActive={theme.is_active} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(theme.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/admin/themes/${theme.id}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit Theme"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <Link 
                          href={`/admin/themes/${theme.id}/preview-images`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Manage Preview Images"
                        >
                          <PhotoIcon className="h-4 w-4" />
                        </Link>
                        <ThemePromptsManagerWrapper 
                          theme={{
                            id: theme.id,
                            name: theme.name,
                            image_count: theme.image_count || 10
                          }}
                        />
                        <button className="text-red-600 hover:text-red-900" title="Delete Theme">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
