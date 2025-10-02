'use client'

import { useCreditBalance } from '@/contexts/CreditContext'
import { SparklesIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function CreditBalance() {
  const { balance, isLoading } = useCreditBalance()

  return (
    <div className="bg-white shadow rounded-lg mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="h-8 w-8 text-gray-400" />
          <div>
            <h2 className="text-lg font-medium text-gray-900">Credit Balance</h2>
            <p className="text-sm text-gray-500">Pay-as-you-go credits for photoshoots</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Available Credits</p>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="text-sm text-primary-600">Updating...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-primary-900">{balance}</p>
                    <p className="text-sm text-primary-600">
                      {balance === 1 ? 'credit' : 'credits'} remaining
                    </p>
                  </>
                )}
              </div>
              <SparklesIcon className="h-10 w-10 text-primary-500" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Cost per Photoshoot</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
              <p className="text-sm text-gray-500">credit</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Estimated Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{balance}</p>
              <p className="text-sm text-gray-500">photoshoots available</p>
            </div>
          </div>
        </div>

        {balance < 5 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                <strong>Low credit balance!</strong> Consider purchasing more credits to continue creating photoshoots.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
