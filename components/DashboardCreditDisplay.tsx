'use client'

import { useCreditBalance } from '@/contexts/CreditContext'

export default function DashboardCreditDisplay() {
  const { balance, isLoading } = useCreditBalance()

  if (isLoading) {
    return (
      <div className="text-sm text-gray-600">
        Credits: <span className="font-medium text-primary-600">Loading...</span>
      </div>
    )
  }

  return (
    <div className="text-sm text-gray-600">
      Credits: <span className="font-medium text-primary-600">{balance}</span>
    </div>
  )
}
