import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session: authSession } } = await supabase.auth.getSession()
    
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authSession.user

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    // Get or create Stripe customer
    let stripeCustomerId: string

    const { data: subscription } = await supabaseAdmin.instance
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subscription?.stripe_customer_id) {
      stripeCustomerId = subscription.stripe_customer_id
    } else {
      // Get user profile from database for name
      const { data: userProfile } = await supabaseAdmin.instance
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() : user.email?.split('@')[0] || 'User',
        metadata: {
          userId: user.id,
        },
      })
      stripeCustomerId = customer.id

      // Update subscription with customer ID
      await supabaseAdmin.instance
        .from('subscriptions')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('user_id', user.id)
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
      },
    })

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
