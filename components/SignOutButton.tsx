'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

export default function SignOutButton() {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/sign-in')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
      title="Sign Out"
    >
      <ArrowRightOnRectangleIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  )
}
