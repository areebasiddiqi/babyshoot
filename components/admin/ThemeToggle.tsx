'use client'

import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface ThemeToggleProps {
  themeId: string
  isActive: boolean
}

export default function ThemeToggle({ themeId, isActive: initialActive }: ThemeToggleProps) {
  const [isActive, setIsActive] = useState(initialActive)
  const [isLoading, setIsLoading] = useState(false)

  const toggleTheme = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/themes/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeId,
          isActive: !isActive
        }),
      })

      if (response.ok) {
        setIsActive(!isActive)
      } else {
        console.error('Failed to toggle theme')
      }
    } catch (error) {
      console.error('Error toggling theme:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleTheme}
      disabled={isLoading}
      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
        isActive 
          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
          : 'bg-red-100 text-red-800 hover:bg-red-200'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isActive ? (
        <>
          <EyeIcon className="h-3 w-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <EyeSlashIcon className="h-3 w-3 mr-1" />
          Inactive
        </>
      )}
    </button>
  )
}
