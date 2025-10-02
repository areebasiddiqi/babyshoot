'use client'

import { useState } from 'react'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import ThemePromptsManager from './ThemePromptsManager'

interface Theme {
  id: string
  name: string
  image_count: number
}

interface ThemePromptsManagerWrapperProps {
  theme: Theme
}

export default function ThemePromptsManagerWrapper({ theme }: ThemePromptsManagerWrapperProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-900"
        title="Manage Prompts"
      >
        <Cog6ToothIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <ThemePromptsManager
          theme={theme}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
