# Credit System Setup Guide

## 🎯 Overview
This guide will help you set up the credit-based payment system using Stripe and Supabase Edge Functions.

## 📋 Prerequisites
- Supabase project set up
- Stripe account (test mode for development)
- Supabase CLI installed
- Environment variables configured

## 🗄️ Step 1: Database Setup

### Run the Credit System Migration
Execute the SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of scripts/create-credit-system.sql
-- This will create:
-- - user_credits table
-- - credit_transactions table  
-- - credit_packages table
-- - Database functions and triggers
-- - RLS policies
```

### Verify Database Setup
After running the script, you should see these new tables in your Supabase dashboard:
- `user_credits`
- `credit_transactions`
- `credit_packages`

## 🔑 Step 2: Stripe Configuration

### 1. Get Stripe Keys
From your Stripe Dashboard:
- **Publishable Key**: `pk_test_...` (for frontend)
- **Secret Key**: `sk_test_...` (for backend)

### 2. Create Stripe Products & Prices
In your Stripe Dashboard, create products for each credit package:

```
Starter Pack: $9.99 for 10 credits
Popular Pack: $19.99 for 25 credits  
Pro Pack: $34.99 for 50 credits
Ultimate Pack: $59.99 for 100 credits
```

### 3. Update Credit Packages
Update the `credit_packages` table with your actual Stripe Price IDs:

```sql
UPDATE credit_packages SET stripe_price_id = 'price_your_actual_price_id' WHERE name = 'Starter Pack';
-- Repeat for all packages
```

## ⚡ Step 3: Supabase Edge Functions

### 1. Deploy Edge Functions
```bash
# Navigate to your project directory
cd /path/to/your/project

# Deploy the webhook function
supabase functions deploy stripe-webhook

# Deploy the payment intent function  
supabase functions deploy create-payment-intent
```

### 2. Set Environment Variables for Edge Functions
In your Supabase dashboard, go to Edge Functions → Settings:

```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 🔗 Step 4: Stripe Webhook Setup

### 1. Get Edge Function URL
After deploying, get your webhook URL:
```
https://your-project-id.supabase.co/functions/v1/stripe-webhook
```

### 2. Configure Stripe Webhook
In Stripe Dashboard → Webhooks:
- **Endpoint URL**: Your Edge Function URL
- **Events to send**:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

### 3. Get Webhook Secret
Copy the webhook signing secret and add it to your environment variables.

## 🌍 Step 5: Environment Variables

### Update your `.env.local` file:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🧪 Step 6: Testing

### 1. Test Credit Purchase
1. Start your development server: `npm run dev`
2. Navigate to `/billing`
3. Select a credit package
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete the purchase
6. Verify credits are added to your account

### 2. Test Credit Usage
1. Navigate to `/create`
2. Create a photoshoot (should deduct 1 credit)
3. Check `/billing` to see the transaction history

### 3. Test Insufficient Credits
1. Reduce your credits to 0 in the database
2. Try to create a photoshoot
3. Should redirect to billing page with error message

## 🔧 Troubleshooting

### Common Issues

**1. Webhook not receiving events**
- Check the webhook URL is correct
- Verify the webhook secret matches
- Check Edge Function logs in Supabase

**2. Payment not adding credits**
- Check webhook is receiving `payment_intent.succeeded`
- Verify user_id and package_id in payment metadata
- Check Edge Function logs for errors

**3. Credit deduction not working**
- Verify the `modify_user_credits` function exists
- Check API logs for credit deduction errors
- Ensure RLS policies allow credit modifications

**4. Authentication errors**
- Use `createServerComponentClient` for server components
- Use `createClientComponentClient` for client components
- Avoid modifying cookies in server components

### Debug Commands

```sql
-- Check user credit balance
SELECT * FROM user_credits WHERE user_id = 'your-user-id';

-- Check recent transactions
SELECT * FROM credit_transactions WHERE user_id = 'your-user-id' ORDER BY created_at DESC;

-- Check credit packages
SELECT * FROM credit_packages WHERE is_active = true;
```

## 🚀 Production Deployment

### 1. Switch to Live Stripe Keys
Replace test keys with live keys in production environment.

### 2. Update Webhook URL
Point Stripe webhook to your production Edge Function URL.

### 3. Test End-to-End
Perform a complete test with real payment methods.

## 📊 Monitoring

### Key Metrics to Track
- Credit purchase conversion rate
- Average credits per user
- Credit usage patterns
- Failed payment attempts

### Useful Queries
```sql
-- Total credits purchased this month
SELECT SUM(amount) as total_credits_purchased 
FROM credit_transactions 
WHERE type = 'purchase' 
AND created_at >= date_trunc('month', now());

-- Users with low credit balances
SELECT user_id, credits 
FROM user_credits 
WHERE credits < 5;
```

## 🎉 Success!

Your credit system is now fully operational! Users can:
- ✅ Purchase credits with Stripe
- ✅ Create photoshoots using credits  
- ✅ View their balance and transaction history
- ✅ Get notified when credits are low

The system automatically handles:
- ✅ Secure payment processing
- ✅ Credit balance management
- ✅ Transaction logging
- ✅ Model reuse cost optimization

For support, check the Edge Function logs in Supabase and Stripe webhook logs for any issues.
