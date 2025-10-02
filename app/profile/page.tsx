import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import ProfileForm from '@/components/ProfileForm'
import { UserCircleIcon } from '@heroicons/react/24/outline'

async function getUserProfile(userId: string) {
  if (!supabaseAdmin.instance) {
    throw new Error('Supabase admin client not available')
  }

  const { data: user, error } = await supabaseAdmin.instance
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return user
}

export default async function ProfilePage() {
  const { cookies } = await import('next/headers')
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/sign-in')
  }

  const user = session.user
  const userProfile = await getUserProfile(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-500">Update your account details and preferences</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <ProfileForm 
              user={user} 
              userProfile={userProfile} 
            />
          </div>
        </div>

        {/* Account Information */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Never'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
