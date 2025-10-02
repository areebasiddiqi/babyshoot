import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentIntentId: string } }
) {
  try {
    const { paymentIntentId } = params

    // Get the authenticated user
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Verify the payment intent belongs to the current user
    if (paymentIntent.metadata?.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
    })

  } catch (error: any) {
    console.error('Error checking payment status:', error)
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
