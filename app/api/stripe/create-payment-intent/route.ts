import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})
export async function POST(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const { packageId } = await request.json()

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get the credit package details
    const { data: creditPackage, error: packageError } = await supabaseAdmin.instance
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (packageError || !creditPackage) {
      return NextResponse.json({ error: 'Invalid credit package' }, { status: 400 })
    }

    // Create payment intent directly with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: creditPackage.price_cents,
      currency: 'usd',
      metadata: {
        user_id: user.id,
        package_id: creditPackage.id,
        package_name: creditPackage.name,
        credits: creditPackage.credits.toString(),
      },
      description: `${creditPackage.name} - ${creditPackage.credits} credits`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      packageDetails: {
        name: creditPackage.name,
        credits: creditPackage.credits,
        price: creditPackage.price_cents / 100, // Convert to dollars
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
