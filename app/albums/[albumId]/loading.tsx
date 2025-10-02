import { PhotoIcon } from '@heroicons/react/24/outline'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <PhotoIcon className="h-12 w-12 text-primary-500 mx-auto animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 opacity-20 rounded-full animate-ping"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Album</h2>
        <p className="text-gray-600">Fetching your beautiful photos...</p>
        
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}
