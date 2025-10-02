# 🚀 Deployment Guide

This guide will help you deploy your BabyShoot AI application to production.

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Git repository set up
- [ ] All required API keys and accounts:
  - [ ] Clerk account and API keys
  - [ ] Supabase project and keys
  - [ ] Astria.ai API key
  - [ ] Stripe account and keys
  - [ ] Vercel account (recommended)

## Quick Deploy to Vercel

### 1. One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/baby-photoshoot-app)

### 2. Manual Deploy

```bash
# Clone the repository
git clone <your-repo-url>
cd baby-photoshoot-app

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts and set environment variables
```

## Environment Variables Setup

### Required Variables

Copy these to your deployment platform:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
CLERK_SECRET_KEY=sk_live_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Astria.ai API
ASTRIA_API_KEY=your_astria_api_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_your_pro_price_id

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Database Setup

### 1. Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script
5. Verify all tables and policies are created

### 2. Verify RLS Policies

Ensure Row Level Security is enabled and policies are active:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Webhook Configuration

### 1. Clerk Webhooks

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy webhook secret to environment variables

### 2. Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copy webhook secret to environment variables

### 3. Astria.ai Webhooks

1. Go to Astria.ai Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/astria`
3. Select events: `tune.completed`, `prompt.completed`

## Domain Configuration

### 1. Custom Domain (Vercel)

```bash
# Add custom domain
vercel domains add your-domain.com

# Configure DNS
# Add CNAME record: your-domain.com → cname.vercel-dns.com
```

### 2. SSL Certificate

Vercel automatically provides SSL certificates. For other platforms:

- Ensure HTTPS is enabled
- Configure SSL certificate
- Update NEXT_PUBLIC_APP_URL to use https://

## Performance Optimization

### 1. Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    domains: [
      'images.unsplash.com',
      'cdn.astria.ai',
      'replicate.delivery',
    ],
    formats: ['image/webp', 'image/avif'],
  },
}
```

### 2. Caching Strategy

```javascript
// Add to next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },
}
```

## Monitoring & Analytics

### 1. Vercel Analytics

```bash
npm install @vercel/analytics
```

```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. Error Monitoring

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- PostHog for product analytics

## Security Checklist

- [ ] All API keys are in environment variables
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation is in place
- [ ] SQL injection protection (RLS policies)
- [ ] XSS protection enabled
- [ ] CSP headers configured

## Testing in Production

### 1. Smoke Tests

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test authentication
# Visit /sign-in and /sign-up pages

# Test payment flow
# Create test subscription with Stripe test mode
```

### 2. User Flow Testing

1. Sign up new user
2. Create child profile
3. Upload photos and create photoshoot
4. Verify training starts
5. Test image generation
6. Test payment upgrade
7. Test image download/sharing

## Backup Strategy

### 1. Database Backups

Supabase provides automatic backups, but consider:

```sql
-- Manual backup
pg_dump your_database_url > backup.sql

-- Restore
psql your_database_url < backup.sql
```

### 2. File Backups

If storing files locally, set up regular backups:

```bash
# Example backup script
#!/bin/bash
aws s3 sync ./uploads s3://your-backup-bucket/uploads/$(date +%Y-%m-%d)
```

## Scaling Considerations

### 1. Database Scaling

- Monitor connection pool usage
- Consider read replicas for heavy read workloads
- Implement database connection pooling

### 2. API Rate Limiting

```javascript
// Implement rate limiting
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

### 3. CDN Configuration

- Use Vercel's Edge Network
- Configure proper cache headers
- Optimize images with Next.js Image component

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Check variable names match exactly
   - Restart deployment after adding variables
   - Verify no trailing spaces in values

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure service role key has proper permissions

3. **Webhook Failures**
   - Check webhook URLs are accessible
   - Verify webhook secrets match
   - Check webhook event selection

4. **Payment Issues**
   - Ensure Stripe keys match environment (test/live)
   - Verify webhook endpoints are configured
   - Check price IDs are correct

### Debug Commands

```bash
# Check deployment logs
vercel logs

# Test API endpoints
curl -X GET https://your-domain.com/api/health

# Check environment variables
vercel env ls
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review deployment logs
3. Test individual components
4. Check third-party service status pages
5. Create an issue in the repository

---

🎉 **Congratulations!** Your BabyShoot AI application is now live and ready to create magical baby photos!
