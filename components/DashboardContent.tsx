'use client'

import { useState, useEffect } from 'react'
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
  BookOpenIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import { CreditProvider } from '@/contexts/CreditContext'
import UserMenu from '@/components/UserMenu'
import DashboardCreditDisplay from '@/components/DashboardCreditDisplay'
import ConfirmDialog from '@/components/ConfirmDialog'

interface DashboardContentProps {
  user: any
  creditBalance: number
  hasAdminAccess: boolean
  children: any[] | null
  sessions: any[] | null
}

export default function DashboardContent({
  user,
  creditBalance: initialCreditBalance,
  hasAdminAccess,
  children: initialChildren,
  sessions: initialSessions
}: DashboardContentProps) {
  const [dashboardData, setDashboardData] = useState({
    children: initialChildren || [],
    sessions: initialSessions || [],
    creditBalance: initialCreditBalance,
    usage: {
      totalSessions: initialSessions?.length || 0,
      thisMonthSessions: 0
    }
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    type: 'session' | 'child'
    id: string
    name: string
  }>({ isOpen: false, type: 'session', id: '', name: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  // Auto-refresh dashboard data every 10 seconds
  useEffect(() => {
    const refreshDashboard = async () => {
      try {
        setIsRefreshing(true)
        const response = await fetch('/api/dashboard')
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error('Failed to refresh dashboard:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    // Refresh immediately on mount to get latest data
    refreshDashboard()

    // Set up polling every 10 seconds
    const interval = setInterval(refreshDashboard, 10000)
    
    // Also refresh when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshDashboard()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const { children, sessions, creditBalance } = dashboardData

  const handleDeleteSession = async (sessionId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/photoshoot/${sessionId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove the session from local state
        setDashboardData(prev => ({
          ...prev,
          sessions: prev.sessions.filter((s: any) => s.id !== sessionId),
          usage: {
            ...prev.usage,
            totalSessions: prev.usage.totalSessions - 1
          }
        }))
        setDeleteDialog({ isOpen: false, type: 'session', id: '', name: '' })
      } else {
        const error = await response.json()
        alert(`Failed to delete session: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete session error:', error)
      alert('Failed to delete session. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteChild = async (childId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove the child from local state
        setDashboardData(prev => ({
          ...prev,
          children: prev.children.filter((c: any) => c.id !== childId)
        }))
        setDeleteDialog({ isOpen: false, type: 'child', id: '', name: '' })
      } else {
        const error = await response.json()
        alert(`Failed to delete child profile: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete child error:', error)
      alert('Failed to delete child profile. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (type: 'session' | 'child', id: string, name: string) => {
    setDeleteDialog({ isOpen: true, type, id, name })
  }

  const handleConfirmDelete = () => {
    if (deleteDialog.type === 'session') {
      handleDeleteSession(deleteDialog.id)
    } else {
      handleDeleteChild(deleteDialog.id)
    }
  }
  
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

  // Helper function to get the initial letter for session placeholder
  const getSessionInitial = (session: any) => {
    if (session.child_id && session.children?.name) {
      // Child session - use child's name
      return session.children.name.charAt(0).toUpperCase()
    } else if (!session.child_id && session.base_prompt) {
      // Family session - extract first family member name from base_prompt
      // The base_prompt contains: "Family portrait featuring Name1 (relation, gender), Name2 (relation, gender)..."
      const match = session.base_prompt.match(/featuring\s+([^(]+)\s*\(/)
      if (match && match[1]) {
        const firstName = match[1].trim()
        return firstName.charAt(0).toUpperCase()
      }
    }
    // Fallback to 'F' for Family or '?' for unknown
    return session.child_id ? '?' : 'F'
  }
  return (
    <CreditProvider initialBalance={creditBalance}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Left side - Logo and page title */}
              <div className="flex items-center space-x-6">
                <Link href="/" className="flex items-center space-x-3 group">
                  <SparklesIcon className="h-8 w-8 text-primary-500 group-hover:text-primary-600 transition-colors" />
                  <span className="text-xl font-bold gradient-text">BabyShoot AI</span>
                </Link>
                <div className="hidden md:block h-6 w-px bg-gray-300"></div>
                <h1 className="hidden md:block text-lg font-medium text-gray-700">Dashboard</h1>
              </div>
              
              {/* Right side - Navigation and actions */}
              <div className="flex items-center space-x-2 lg:space-x-4">
                {/* Credits display */}
                <div className="hidden sm:block">
                  <DashboardCreditDisplay />
                </div>
                
                {/* Navigation links - hidden on small screens */}
                <div className="hidden lg:flex items-center space-x-2">
                  <Link 
                    href="/gallery" 
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <RectangleStackIcon className="h-4 w-4 mr-2" />
                    Gallery
                  </Link>
                  <Link 
                    href="/albums" 
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <BookOpenIcon className="h-4 w-4 mr-2" />
                    Albums
                  </Link>
                  {hasAdminAccess && (
                    <Link 
                      href="/admin" 
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <CogIcon className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  )}
                </div>
                
                {/* Primary action button */}
                <Link 
                  href={dashboardData.creditBalance > 0 ? "/create" : "/billing"} 
                  className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {dashboardData.creditBalance > 0 ? (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">New Photoshoot</span>
                      <span className="sm:hidden">Create</span>
                    </>
                  ) : (
                    <>
                      <BanknotesIcon className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Buy Credits</span>
                      <span className="sm:hidden">Credits</span>
                    </>
                  )}
                </Link>
                
                {/* User menu */}
                <UserMenu 
                  userEmail={user.email || undefined}
                  userName={user.user_metadata?.first_name || user.user_metadata?.name || undefined}
                />
              </div>
            </div>
          </div>
          
          {/* Mobile navigation - shown on small screens */}
          <div className="lg:hidden border-t border-gray-200 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-center space-x-8 py-3">
                <Link 
                  href="/gallery" 
                  className="flex flex-col items-center text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <RectangleStackIcon className="h-5 w-5 mb-1" />
                  Gallery
                </Link>
                <Link 
                  href="/albums" 
                  className="flex flex-col items-center text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <BookOpenIcon className="h-5 w-5 mb-1" />
                  Albums
                </Link>
                {hasAdminAccess && (
                  <Link 
                    href="/admin" 
                    className="flex flex-col items-center text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <CogIcon className="h-5 w-5 mb-1" />
                    Admin
                  </Link>
                )}
                <div className="sm:hidden">
                  <DashboardCreditDisplay />
                </div>
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
                        {dashboardData.usage.totalSessions}
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
                        {sessions.filter((s: any) => s.status === 'completed').length}
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
                        {children.length}
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
                        {dashboardData.creditBalance}
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
                <div className="flex items-center space-x-4">
                  <Link href="/gallery" className="text-primary-600 hover:text-primary-700 font-medium">
                    View All in Gallery
                  </Link>
                  <Link href={dashboardData.creditBalance > 0 ? "/create" : "/billing"} className="text-primary-600 hover:text-primary-700 font-medium">
                    {dashboardData.creditBalance > 0 ? "Create New" : "Buy Credits"}
                  </Link>
                </div>
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
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                              {getSessionInitial(session)}
                            </div>
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
                          <div className="flex items-center space-x-2">
                            <Link 
                              href={`/session/${session.id}`}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                              prefetch={true}
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => openDeleteDialog('session', session.id, session.children?.name || 'Family Session')}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete photoshoot"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
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
                <Link href={dashboardData.creditBalance > 0 ? "/children/new" : "/billing"} className="text-primary-600 hover:text-primary-700 font-medium">
                  {dashboardData.creditBalance > 0 ? "Add Child" : "Buy Credits"}
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
                        href={dashboardData.creditBalance > 0 ? `/create?child=${child.id}` : "/billing"}
                        className={`text-sm flex-1 text-center ${dashboardData.creditBalance > 0 ? "btn-primary" : "btn-secondary"}`}
                      >
                        {dashboardData.creditBalance > 0 ? "New Shoot" : "Buy Credits"}
                      </Link>
                      <button
                        onClick={() => openDeleteDialog('child', child.id, child.name)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Delete child profile"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: 'session', id: '', name: '' })}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteDialog.type === 'session' ? 'Photoshoot' : 'Child Profile'}`}
        message={
          deleteDialog.type === 'session'
            ? `Are you sure you want to delete the photoshoot for "${deleteDialog.name}"? This will permanently delete all generated images and cannot be undone.`
            : `Are you sure you want to delete the profile for "${deleteDialog.name}"? This action cannot be undone. Note: You must delete all associated photoshoots first.`
        }
        confirmText="Delete"
        isLoading={isDeleting}
        type="danger"
      />
    </CreditProvider>
  )
}
