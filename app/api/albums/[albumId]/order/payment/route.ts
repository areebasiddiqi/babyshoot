import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  try {
    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    // Get the order details
    const { data: order, error: orderError } = await supabaseAdmin.instance
      .from('album_orders')
      .select(`
        *,
        albums (
          title,
          album_images (count)
        )
      `)
      .eq('id', orderId)
      .eq('user_id', session.user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order is not pending payment' }, { status: 400 })
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total_amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        order_id: order.id,
        album_id: order.album_id,
        user_id: order.user_id,
        album_title: order.albums.title
      },
      description: `Album Order: ${order.albums.title} (${order.album_size}, ${order.cover_type})`,
    })

    // Update order with payment intent ID
    await supabaseAdmin.instance
      .from('album_orders')
      .update({ 
        payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create payment',
      details: error.message 
    }, { status: 500 })
  }
}
