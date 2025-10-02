# Stripe Payment Setup for Album Orders

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret (get from webhook endpoint settings)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Stripe Dashboard Setup

### 1. Create Stripe Account
- Go to https://stripe.com and create an account
- Complete business verification if needed

### 2. Get API Keys
- Go to Developers → API Keys
- Copy the **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Copy the **Secret key** → `STRIPE_SECRET_KEY`

### 3. Setup Webhook Endpoint
- Go to Developers → Webhooks
- Click "Add endpoint"
- Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
- Select events to listen for:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

## Testing Payments

Use these test card numbers:

### Successful Payment
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### Failed Payment
- Card: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Payment Flow

1. **User creates album order** → Status: `pending`
2. **User clicks "Pay Now"** → Redirected to payment page
3. **Payment processed** → Stripe webhook updates status to `paid`
4. **Admin processes order** → Status: `processing` → `shipped` → `delivered`

## Webhook Testing (Local Development)

Install Stripe CLI:
```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases
# Mac: brew install stripe/stripe-cli/stripe
# Linux: Download binary

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will give you a webhook secret starting with whsec_
# Use this as your STRIPE_WEBHOOK_SECRET
```

## Production Setup

1. **Update webhook URL** to your production domain
2. **Use live API keys** instead of test keys
3. **Update webhook secret** with production webhook secret
4. **Enable live mode** in Stripe dashboard

## Security Notes

- Never expose secret keys in client-side code
- Always validate webhook signatures
- Use HTTPS in production
- Store sensitive data securely
