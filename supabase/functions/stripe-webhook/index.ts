import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)

    console.log(`Received event: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }
})

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { user_id, package_id, order_id } = paymentIntent.metadata

    // Handle album order payment
    if (order_id) {
      console.log(`Processing album order payment: ${order_id}`)
      
      const { error: orderError } = await supabase
        .from('album_orders')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id)
        .eq('payment_intent_id', paymentIntent.id)

      if (orderError) {
        console.error('Error updating album order:', orderError)
        return
      }

      console.log(`Successfully updated album order ${order_id} to paid status`)
      return
    }

    // Handle credit purchase payment
    if (!user_id || !package_id) {
      console.error('Missing metadata in payment intent:', paymentIntent.metadata)
      return
    }

    // Get the credit package details
    const { data: creditPackage, error: packageError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', package_id)
      .single()

    if (packageError || !creditPackage) {
      console.error('Error fetching credit package:', packageError)
      return
    }

    // Add credits to user account using the database function
    const { error: creditError } = await supabase.rpc('modify_user_credits', {
      user_uuid: user_id,
      credit_amount: creditPackage.credits,
      transaction_type: 'purchase',
      transaction_description: `Purchased ${creditPackage.name} - ${creditPackage.credits} credits`,
      stripe_payment_id: paymentIntent.id
    })

    if (creditError) {
      console.error('Error adding credits:', creditError)
      return
    }

    console.log(`Successfully added ${creditPackage.credits} credits to user ${user_id}`)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { user_id, order_id } = paymentIntent.metadata
    
    if (order_id) {
      console.log(`Album order payment failed: ${order_id}`)
      // Keep order as pending so user can retry payment
      // Optionally, you could update a failed_attempts counter
    } else {
      console.log(`Credit purchase payment failed for user ${user_id}:`, paymentIntent.last_payment_error?.message)
    }
    
    // You could send an email notification here or log to a monitoring service
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}
