import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  CogIcon,
  UserGroupIcon,
  SparklesIcon,
  PhotoIcon,
  ChartBarIcon,
  PlusIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin-utils'
import UserMenu from '@/components/UserMenu'

async function getAdminData(userId: string) {
  if (!supabaseAdmin.instance) {
    throw new Error('Supabase admin client not available')
  }

  // Get total users
  const { count: totalUsers } = await supabaseAdmin.instance
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get total sessions
  const { count: totalSessions } = await supabaseAdmin.instance
    .from('photoshoot_sessions')
    .select('*', { count: 'exact', head: true })

  // Get total themes
  const { count: totalThemes } = await supabaseAdmin.instance
    .from('themes')
    .select('*', { count: 'exact', head: true })

  // Get recent sessions
  const { data: recentSessions } = await supabaseAdmin.instance
    .from('photoshoot_sessions')
    .select(`
      *,
      users (email, first_name, last_name),
      children (name),
      themes (name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get active themes
  const { data: themes } = await supabaseAdmin.instance
    .from('themes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return {
    stats: {
      totalUsers: totalUsers || 0,
      totalSessions: totalSessions || 0,
      totalThemes: totalThemes || 0
    },
    recentSessions,
    themes
  }
}

export default async function AdminDashboard() {
  const { cookies } = await import('next/headers')
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/sign-in')
  }

  const user = session.user
  const hasAdminAccess = await isAdmin(user.id)
  
  if (!hasAdminAccess) {
    redirect('/dashboard')
  }

  const { stats, recentSessions, themes } = await getAdminData(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <SparklesIcon className="h-8 w-8 text-primary-500" />
                <span className="text-xl font-bold gradient-text">BabyShoot AI</span>
              </Link>
              <div className="hidden sm:block text-gray-300">|</div>
              <h1 className="hidden sm:block text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="btn-secondary">
                User Dashboard
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Dashboard 🛠️
          </h2>
          <p className="text-gray-600">
            Manage themes, users, and monitor system activity.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg border border-primary-200">
                <UserGroupIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-primary-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <PhotoIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <SparklesIcon className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Themes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalThemes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Link href="/admin/themes" className="card hover:shadow-xl transition-all duration-200 group">
            <div className="text-center">
              <SparklesIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Themes</h3>
              <p className="text-gray-600 text-sm">Add, edit, and organize themes</p>
            </div>
          </Link>

          <Link href="/admin/users" className="card hover:shadow-xl transition-all duration-200 group">
            <div className="text-center">
              <UserGroupIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h3>
              <p className="text-gray-600 text-sm">View and manage user accounts</p>
            </div>
          </Link>

          <Link href="/admin/orders" className="card hover:shadow-xl transition-all duration-200 group">
            <div className="text-center">
              <TruckIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Orders</h3>
              <p className="text-gray-600 text-sm">Track and update album orders</p>
            </div>
          </Link>
          <Link href="/super-admin/config" className="card hover:shadow-xl transition-all duration-200 group border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="text-center">
              <CogIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Super Admin</h3>
              <p className="text-gray-600 text-sm">Configure app settings</p>
            </div>
          </Link>
        </div>

        {/* Recent Sessions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
            <Link href="/admin/sessions" className="text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Theme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSessions?.map((session: any) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {session.users?.first_name || session.users?.email}
                        </div>
                        <div className="text-sm text-gray-500">{session.users?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.child_id ? session.children?.name : 'Family Session'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.themes?.name || 'Custom'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          session.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(session.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Active Themes Preview */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Active Themes</h3>
            <Link href="/admin/themes" className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Theme
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {themes?.slice(0, 8).map((theme: any) => (
              <div key={theme.id} className="card">
                <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl mb-4 flex items-center justify-center">
                  <SparklesIcon className="h-12 w-12 text-primary-400" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{theme.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {theme.category}
                  </span>
                  <span className="text-xs px-2 py-1 bg-primary-100 text-primary-600 rounded-full">
                    {theme.session_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
