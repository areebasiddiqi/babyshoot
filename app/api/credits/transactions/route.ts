import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const { searchParams } = request.nextUrl
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get user's credit transactions
    const { data: transactions, error } = await supabaseAdmin.instance
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching credit transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Format transactions for frontend
    const formattedTransactions = transactions?.map((transaction: any) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      createdAt: transaction.created_at,
      stripePaymentId: transaction.stripe_payment_intent_id,
      photoshootSessionId: transaction.photoshoot_session_id
    })) || []

    return NextResponse.json({ 
      transactions: formattedTransactions,
      hasMore: transactions?.length === limit
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
