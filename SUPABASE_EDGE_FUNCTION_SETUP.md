# Supabase Edge Function Setup for Stripe Webhooks

## Prerequisites

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

## Deploy the Edge Function

1. **Deploy the stripe-webhook function**:
   ```bash
   supabase functions deploy stripe-webhook
   ```

2. **Set environment variables** in Supabase Dashboard:
   - Go to Project Settings → Edge Functions
   - Add these secrets:
     ```
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=eyJ...
     ```

## Configure Stripe Webhook

1. **Get the Edge Function URL**:
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```

2. **In Stripe Dashboard**:
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy the webhook signing secret

3. **Update environment variables** with the webhook secret

## Test the Webhook

1. **Local testing** (optional):
   ```bash
   supabase functions serve stripe-webhook
   ```

2. **Use Stripe CLI** to forward webhooks:
   ```bash
   stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
   ```

3. **Test with a payment**:
   - Create an album order
   - Complete payment with test card: `4242 4242 4242 4242`
   - Check Supabase logs to see webhook processing
   - Verify order status updates to "paid"

## Monitoring

1. **View Edge Function logs**:
   - Go to Supabase Dashboard → Edge Functions
   - Click on "stripe-webhook"
   - View logs and invocations

2. **Check webhook delivery** in Stripe Dashboard:
   - Go to Developers → Webhooks
   - Click on your webhook endpoint
   - View recent deliveries and responses

## Troubleshooting

### Common Issues:

1. **Webhook signature verification failed**:
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint URL matches exactly

2. **Database connection issues**:
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set
   - Check RLS policies allow service role access

3. **Order not updating**:
   - Ensure `album_orders` table exists
   - Check `payment_intent_id` field exists
   - Verify order metadata includes `order_id`

### Debug Steps:

1. **Check Edge Function logs**:
   ```bash
   supabase functions logs stripe-webhook
   ```

2. **Test webhook locally**:
   ```bash
   supabase functions serve stripe-webhook --debug
   ```

3. **Verify database schema**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'album_orders';
   ```

## Production Deployment

1. **Use live Stripe keys**:
   - Replace test keys with live keys
   - Update webhook endpoint to production URL

2. **Monitor webhook delivery**:
   - Set up alerts for failed webhooks
   - Monitor Edge Function performance

3. **Backup webhook handling**:
   - Consider implementing retry logic
   - Add monitoring for payment status updates

## Security Notes

- Edge Functions run in isolated environments
- Webhook signatures are verified automatically
- Service role key has full database access
- All environment variables are encrypted
