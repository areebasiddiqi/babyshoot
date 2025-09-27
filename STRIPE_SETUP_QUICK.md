# 🚀 Quick Stripe Setup Guide

## ❌ Current Error
```
IntegrationError: Missing value for Stripe(): apiKey should be a string.
```

## ✅ Quick Fix

### 1. Create/Update your `.env.local` file
In your project root, create or update `.env.local` with:

```env
# Stripe Configuration (Required for credit system)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Your existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Your existing Astria config
ASTRIA_API_KEY=your_astria_api_key
ASTRIA_BASE_URL=https://api.astria.ai
```

### 2. Get Your Stripe Keys

#### Option A: Use Test Keys (Recommended for Development)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

#### Option B: Skip Stripe for Now
If you want to test other features first, the app will show a configuration message instead of crashing.

### 3. Restart Your Development Server
```bash
npm run dev
```

### 4. Test the Fix
1. Navigate to `/billing`
2. You should see either:
   - Credit packages (if Stripe is configured)
   - Configuration instructions (if Stripe is not configured)
   - No more crash errors! ✅

## 🔧 What I Fixed

1. **Prevented Stripe crashes** - Added fallback for missing API keys
2. **Added configuration detection** - Shows helpful setup message
3. **Graceful error handling** - No more runtime errors

## 🎯 Next Steps (Optional)

If you want to enable credit purchases:

1. **Set up Stripe account** (free)
2. **Add API keys** to `.env.local`
3. **Run database migration** (`scripts/create-credit-system.sql`)
4. **Deploy Edge Functions** (for webhook handling)

## 🚨 Important Notes

- **Never commit `.env.local`** - It's already in `.gitignore`
- **Use test keys** for development
- **Switch to live keys** only in production
- **Restart server** after changing environment variables

Your app should now load without errors! 🎉
