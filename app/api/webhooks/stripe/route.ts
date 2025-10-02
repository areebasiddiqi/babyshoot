import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// DISABLED: Using Supabase Edge Function instead
// See: supabase/functions/stripe-webhook/index.ts
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Webhook disabled - using Supabase Edge Function',
    message: 'Please use the Supabase Edge Function for webhook handling'
  }, { status: 410 })
}

// DISABLED WEBHOOK CODE - Using Supabase Edge Function instead
// The webhook logic has been moved to: supabase/functions/stripe-webhook/index.ts
// This code is kept for reference but not exported as a route handler
