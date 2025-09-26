import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (userId && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          // Update user's subscription in database
          await supabaseAdmin
            .from('subscriptions')
            .update({
              plan: 'pro',
              status: 'active',
              stripe_subscription_id: subscription.id,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              photoshoots_limit: 999, // Unlimited for pro plan
            })
            .eq('user_id', userId)

          console.log('Subscription activated for user:', userId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const customer = await stripe.customers.retrieve(subscription.customer as string)
          
          if (customer && !customer.deleted) {
            const userId = customer.metadata?.userId
            
            if (userId) {
              // Reset monthly usage on successful payment
              await supabaseAdmin
                .from('subscriptions')
                .update({
                  status: 'active',
                  photoshoots_used: 0,
                  current_period_start: new Date(subscription.current_period_start * 1000),
                  current_period_end: new Date(subscription.current_period_end * 1000),
                })
                .eq('user_id', userId)

              console.log('Subscription renewed for user:', userId)
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const customer = await stripe.customers.retrieve(subscription.customer as string)
          
          if (customer && !customer.deleted) {
            const userId = customer.metadata?.userId
            
            if (userId) {
              await supabaseAdmin
                .from('subscriptions')
                .update({ status: 'past_due' })
                .eq('user_id', userId)

              console.log('Payment failed for user:', userId)
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        
        if (customer && !customer.deleted) {
          const userId = customer.metadata?.userId
          
          if (userId) {
            // Downgrade to free plan
            await supabaseAdmin
              .from('subscriptions')
              .update({
                plan: 'free',
                status: 'canceled',
                stripe_subscription_id: null,
                photoshoots_limit: 1,
              })
              .eq('user_id', userId)

            console.log('Subscription canceled for user:', userId)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
