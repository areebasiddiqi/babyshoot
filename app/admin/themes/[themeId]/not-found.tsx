import Link from 'next/link'
import { SparklesIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <SparklesIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Theme Not Found</h1>
          <p className="text-gray-600">
            The theme you're looking for doesn't exist or has been removed.
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            href="/admin/themes" 
            className="btn-primary inline-flex items-center space-x-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Themes</span>
          </Link>
          
          <div>
            <Link 
              href="/admin" 
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
