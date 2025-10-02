'use client'

import Link from 'next/link'
import { 
  PlusIcon, 
  PhotoIcon, 
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  CameraIcon,
  BanknotesIcon,
  CogIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { CreditProvider } from '@/contexts/CreditContext'
import UserMenu from '@/components/UserMenu'
import DashboardCreditDisplay from '@/components/DashboardCreditDisplay'

interface DashboardContentProps {
  user: any
  creditBalance: number
  hasAdminAccess: boolean
  children: any[] | null
  sessions: any[] | null
}

export default function DashboardContent({
  user,
  creditBalance,
  hasAdminAccess,
  children,
  sessions
}: DashboardContentProps) {
  
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
    <CreditProvider initialBalance={creditBalance}>
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
                <DashboardCreditDisplay />
                <Link href="/albums" className="btn-secondary">
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  Albums
                </Link>
                {hasAdminAccess && (
                  <Link href="/admin" className="btn-secondary">
                    <CogIcon className="h-5 w-5 mr-2" />
                    Admin
                  </Link>
                )}
                <Link href={creditBalance > 0 ? "/create" : "/billing"} className="btn-primary">
                  {creditBalance > 0 ? (
                    <>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      New Photoshoot
                    </>
                  ) : (
                    <>
                      <BanknotesIcon className="h-5 w-5 mr-2" />
                      Buy Credits
                    </>
                  )}
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
                  <h3 className="text-sm font-medium text-blue-800">
                    Save time and credits with model reuse!
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Creating multiple photoshoots for the same child or family composition within 30 days? 
                      We'll automatically reuse the AI model to save you time and credits!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PhotoIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Sessions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {sessions?.length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {sessions?.filter((s: any) => s.status === 'completed').length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CameraIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Children
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {children?.length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BanknotesIcon className="h-6 w-6 text-primary-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Credits
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {creditBalance}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          {sessions && sessions.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Photoshoots</h3>
                <Link href={creditBalance > 0 ? "/create" : "/billing"} className="text-primary-600 hover:text-primary-700 font-medium">
                  {creditBalance > 0 ? "Create New" : "Buy Credits"}
                </Link>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {sessions.slice(0, 4).map((session: any) => (
                  <div key={session.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="flex">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 flex-shrink-0">
                        {session.generated_images && session.generated_images.length > 0 ? (
                          <img 
                            src={session.generated_images[0].thumbnail_url || session.generated_images[0].image_url}
                            alt="Generated photo"
                            className="w-full h-full object-cover rounded-l-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 rounded-l-lg flex items-center justify-center">
                            <PhotoIcon className="h-8 w-8 text-primary-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(session.status)}
                            <h4 className="text-sm font-medium text-gray-900">
                              {session.child_id ? session.children?.name : 'Family Session'}
                            </h4>
                          </div>
                          {session.model_reused && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Model Reused
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-3">
                          {session.themes?.name || 'Custom Theme'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {getStatusText(session.status)}
                          </span>
                          <Link 
                            href={`/session/${session.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            prefetch={true}
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Children Profiles */}
          {children && children.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Your Children</h3>
                <Link href={creditBalance > 0 ? "/children/new" : "/billing"} className="text-primary-600 hover:text-primary-700 font-medium">
                  {creditBalance > 0 ? "Add Child" : "Buy Credits"}
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {children.map((child: any) => (
                  <div key={child.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{child.name}</h4>
                        <p className="text-sm text-gray-500">Age {child.age}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Link 
                        href={creditBalance > 0 ? `/create?child=${child.id}` : "/billing"}
                        className={`text-sm flex-1 text-center ${creditBalance > 0 ? "btn-primary" : "btn-secondary"}`}
                      >
                        {creditBalance > 0 ? "New Shoot" : "Buy Credits"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CreditProvider>
  )
}
