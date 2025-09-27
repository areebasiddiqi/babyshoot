import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  PlusIcon, 
  PhotoIcon, 
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  CameraIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '@/lib/supabase'
import UserMenu from '@/components/UserMenu'

async function getUserData(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available - check SUPABASE_SERVICE_ROLE_KEY')
  }

  // Get user's children
  const { data: children } = await supabaseAdmin
    .from('children')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Get user's sessions
  const { data: sessions } = await supabaseAdmin
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
  const { data: creditBalance } = await supabaseAdmin.rpc('get_user_credit_balance', {
    user_uuid: userId
  })

  // Get usage statistics
  const { count: totalSessions } = await supabaseAdmin
    .from('photoshoot_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get this month's sessions
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: thisMonthSessions } = await supabaseAdmin
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'training':
      case 'generating':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />
      case 'failed':
        return <div className="h-5 w-5 rounded-full bg-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'training': return 'Training AI Model'
      case 'ready': return 'Ready to Generate'
      case 'generating': return 'Generating Images'
      case 'completed': return 'Completed'
      case 'failed': return 'Failed'
      default: return status
    }
  }

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
              <h1 className="hidden sm:block text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Credits: <span className="font-medium text-primary-600">{creditBalance}</span>
              </div>
              <Link href="/create" className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Photoshoot
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
            Welcome back, {user.user_metadata?.first_name || user.email?.split('@')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Create magical photoshoots for your little ones with AI.
          </p>
        </div>

        {/* Model Reuse Tip */}
        {sessions && sessions.some((session: any) => session.status === 'completed') && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-blue-500">💡</span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Pro Tip: Save Time & Money
                </h4>
                <p className="text-sm text-blue-700">
                  Create multiple photoshoots with different themes for the same child or family composition within 30 days to reuse the AI model - no retraining needed!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Low Credit Warning */}
        {creditBalance < 3 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-yellow-800">
                  {creditBalance === 0 ? 'No Credits Remaining' : 'Low Credit Balance'}
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {creditBalance === 0 
                    ? 'You need credits to create photoshoots. Purchase credits to continue.'
                    : `You have ${creditBalance} credit${creditBalance !== 1 ? 's' : ''} remaining. Consider purchasing more to avoid interruption.`
                  }
                </p>
              </div>
              <div className="ml-3">
                <Link 
                  href="/billing" 
                  className="inline-flex items-center px-3 py-2 border border-yellow-300 shadow-sm text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors"
                >
                  Buy Credits
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg border border-primary-200">
                <BanknotesIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Credits</p>
                <p className="text-2xl font-bold text-primary-900">{creditBalance}</p>
                <p className="text-xs text-primary-600">{creditBalance === 1 ? 'credit' : 'credits'} remaining</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <CameraIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{usage.totalSessions}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <SparklesIcon className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Children Profiles</p>
                <p className="text-2xl font-bold text-gray-900">{children?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usage.thisMonthSessions}
                </p>
                <p className="text-sm text-gray-500">photoshoots created</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reusable Sessions */}
        {sessions && sessions.filter(s => s.status === 'completed' && s.model_id).length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready for New Themes</h3>
                <p className="text-sm text-gray-600">Create new photoshoots with different themes using existing models</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions
                .filter(session => session.status === 'completed' && session.model_id)
                .slice(0, 6)
                .map((session: any) => (
                <div key={session.id} className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center overflow-hidden mr-3">
                        {session.generated_images && session.generated_images.length > 0 ? (
                          <img 
                            src={session.generated_images[0].thumbnail_url || session.generated_images[0].image_url}
                            alt="Generated photo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PhotoIcon className="h-6 w-6 text-primary-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {session.child_id ? session.children?.name : 'Family'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {session.themes?.name || 'Custom Theme'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Model Ready</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Images:</span>
                      <span className="text-gray-900">
                        {session.generated_images?.length || 0} generated
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link 
                      href={`/session/${session.id}`}
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 text-center transition-colors"
                    >
                      View Session
                    </Link>
                    <Link 
                      href={`/create?${session.child_id ? `child=${session.child_id}` : `reuseSession=${session.id}`}`}
                      className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 text-center transition-colors"
                    >
                      New Theme
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {(!children || children.length === 0) && (
          <div className="card mb-8 bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
            <div className="text-center py-8">
              <SparklesIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Let's create your first photoshoot!
              </h3>
              <p className="text-gray-600 mb-6">
                Start by adding your child's profile, then choose a magical theme.
              </p>
              <Link href="/create" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Photoshoots</h3>
            {sessions && sessions.length > 0 && (
              <Link href="/gallery" className="text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            )}
          </div>

          {!sessions || sessions.length === 0 ? (
            <div className="card text-center py-12">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No photoshoots yet</h4>
              <p className="text-gray-600 mb-6">
                Create your first AI-powered baby photoshoot to get started.
              </p>
              <Link href="/create" className="btn-primary">
                Create Photoshoot
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.slice(0, 6).map((session: any) => (
                <Link 
                  key={session.id} 
                  href={`/session/${session.id}`}
                  className="card hover:shadow-xl transition-all duration-200 group"
                >
                  <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    {session.generated_images && session.generated_images.length > 0 ? (
                      <img 
                        src={session.generated_images[0].thumbnail_url || session.generated_images[0].image_url}
                        alt="Generated photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <PhotoIcon className="h-12 w-12 text-primary-400" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {session.children?.name}'s Photoshoot
                    </h4>
                    {getStatusIcon(session.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Theme: {session.themes?.name || 'Custom'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusText(session.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Children Profiles */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Children Profiles</h3>
            <Link href="/children/new" className="text-primary-600 hover:text-primary-700 font-medium">
              Add Child
            </Link>
          </div>

          {!children || children.length === 0 ? (
            <div className="card text-center py-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Add your first child</h4>
              <p className="text-gray-600 mb-4">
                Create a profile to personalize AI-generated photoshoots.
              </p>
              <Link href="/children/new" className="btn-primary">
                Add Child Profile
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child: any) => (
                <div key={child.id} className="card">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{child.name}</h4>
                      <p className="text-sm text-gray-600">
                        {child.age_in_months < 12 
                          ? `${child.age_in_months} months old`
                          : `${Math.floor(child.age_in_months / 12)} years old`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Link 
                      href={`/children/${child.id}/edit`}
                      className="btn-secondary text-sm flex-1 text-center"
                    >
                      Edit
                    </Link>
                    <Link 
                      href={`/create?child=${child.id}`}
                      className="btn-primary text-sm flex-1 text-center"
                    >
                      New Shoot
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
