'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { 
  UserCircleIcon, 
  ChevronDownIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

interface UserMenuProps {
  userEmail?: string
  userName?: string
}

export default function UserMenu({ userEmail, userName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  const displayName = userName || userEmail?.split('@')[0] || 'User'
  const displayEmail = userEmail

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/sign-in')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <UserCircleIcon className="h-5 w-5" />
        <span className="hidden sm:inline">{displayName}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            {displayEmail && (
              <p className="text-sm text-gray-500 truncate">{displayEmail}</p>
            )}
          </div>
          
          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <UserCircleIcon className="h-4 w-4 mr-3" />
              Profile Settings
            </Link>
            
            <Link
              href="/orders"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <TruckIcon className="h-4 w-4 mr-3" />
              My Orders
            </Link>
            
            <Link
              href="/billing"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <CreditCardIcon className="h-4 w-4 mr-3" />
              Billing & Subscription
            </Link>
          </div>
          
          <div className="border-t border-gray-200 py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
