import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import CreditPurchase from '@/components/CreditPurchase'
import { CreditProvider } from '@/contexts/CreditContext'
import CreditBalance from '@/components/CreditBalance'
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

async function getUserCredits(userId: string) {
  if (!supabaseAdmin.instance) {
    throw new Error('Supabase admin client not available')
  }

  // Get user credit balance
  const { data: balance, error: balanceError } = await supabaseAdmin.instance.rpc('get_user_credit_balance', {
    user_uuid: userId
  })

  if (balanceError) {
    console.error('Error fetching credit balance:', balanceError)
    return { balance: 0, transactions: [] }
  }

  // Get recent transactions
  const { data: transactions, error: transactionError } = await supabaseAdmin.instance
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (transactionError) {
    console.error('Error fetching transactions:', transactionError)
    return { balance: balance || 0, transactions: [] }
  }

  return { balance: balance || 0, transactions: transactions || [] }
}

async function getUserUsage(userId: string) {
  if (!supabaseAdmin.instance) {
    throw new Error('Supabase admin client not available')
  }

  // Get total sessions count
  const { count: totalSessions } = await supabaseAdmin.instance
    .from('photoshoot_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get sessions this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: thisMonthSessions } = await supabaseAdmin.instance
    .from('photoshoot_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  return {
    totalSessions: totalSessions || 0,
    thisMonthSessions: thisMonthSessions || 0
  }
}

export default async function BillingPage() {
  const { cookies } = await import('next/headers')
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/sign-in')
  }

  const user = session.user
  const { balance, transactions } = await getUserCredits(user.id)
  const usage = await getUserUsage(user.id)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'canceled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'past_due':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'canceled': return 'Canceled'
      case 'past_due': return 'Past Due'
      default: return status
    }
  }

  return (
    <CreditProvider initialBalance={balance}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">Billing & Subscription</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Credit Balance */}
          <CreditBalance />

          {/* Purchase Credits */}
          <CreditPurchase currentBalance={balance} />

        {/* Usage Statistics */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Usage Statistics</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <SparklesIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Total Photoshoots</p>
                    <p className="text-2xl font-bold text-blue-900">{usage.totalSessions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">This Month</p>
                    <p className="text-2xl font-bold text-green-900">{usage.thisMonthSessions}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          </div>
          <div className="p-6">
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'purchase' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'purchase' ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <SparklesIcon className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h4>
                <p className="text-gray-600">
                  Your credit transactions will appear here once you make purchases or use credits.
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </CreditProvider>
  )
}
