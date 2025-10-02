'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface NavigationButtonProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetch?: boolean
  showLoader?: boolean
}

export default function NavigationButton({ 
  href, 
  children, 
  className = '', 
  prefetch = false,
  showLoader = true 
}: NavigationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    if (!showLoader) return // Let Link handle normally
    
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await router.push(href)
    } catch (error) {
      console.error('Navigation error:', error)
      setIsLoading(false)
    }
  }

  if (!showLoader) {
    return (
      <Link href={href} className={className} prefetch={prefetch}>
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
}
