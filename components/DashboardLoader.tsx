'use client'

import { SparklesIcon } from '@heroicons/react/24/outline'

export default function DashboardLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <SparklesIcon className="h-16 w-16 text-primary-500 mx-auto animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 opacity-20 rounded-full animate-ping"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Dashboard</h2>
        <p className="text-gray-600 mb-8">Preparing your magical photoshoot experience...</p>
        
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        <div className="mt-8 max-w-md mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Loading your photoshoots...</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span className="text-sm text-gray-600">Checking credit balance...</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span className="text-sm text-gray-600">Preparing workspace...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
