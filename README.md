# BabyShoot AI - Magical Baby Photoshoots

A complete, production-ready baby photoshoot web application powered by AI. Create stunning, professional baby portraits using Astria.ai's fine-tuned image generation with fallback options for optimal results.

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure signup/login via Clerk (email/password + OAuth)
- **Child Profiles**: Detailed profile creation with physical characteristics
- **AI Model Training**: Fine-tune models using user-uploaded photos
- **Theme Selection**: Pre-designed baby-safe themes (Newborn in Bloom, Superhero Adventure, etc.)
- **Image Generation**: High-quality 1024x1024 AI-generated photos
- **Gallery Management**: View, download, and share generated images

### Premium Features
- **Subscription Management**: Free tier (1 photoshoot/month) + Pro tier (unlimited)
- **Stripe Integration**: Secure payment processing
- **Usage Tracking**: Monitor photoshoot limits and usage
- **Priority Support**: Enhanced support for Pro users

### Technical Features
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: WebSocket-like polling for training/generation status
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **Security**: Row-level security with Supabase, secure file uploads
- **Analytics Ready**: Built-in hooks for Vercel Analytics or PostHog

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **Framer Motion** for animations
- **React Hook Form** for form management

### Backend
- **Next.js API Routes** for serverless functions
- **Supabase** for database and authentication
- **Clerk** for user management
- **Stripe** for payments

### AI Integration
- **Astria.ai** for primary image generation
- **Replicate** as fallback option
- **Custom prompt engineering** for baby-safe outputs

### Deployment
- **Vercel** for hosting and CI/CD
- **Supabase** for database hosting
- **Stripe** for payment processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Clerk account
- Astria.ai API key
- Stripe account (for payments)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd baby-photoshoot-app
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your API keys and configuration:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Astria.ai API
ASTRIA_API_KEY=your_astria_api_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Set up Supabase database**
```bash
# Run the schema.sql file in your Supabase SQL editor
# File location: supabase/schema.sql
```

4. **Configure Clerk**
- Set up your Clerk application
- Configure OAuth providers (Google, Apple)
- Set webhook endpoint: `https://your-domain.com/api/webhooks/clerk`

5. **Configure Stripe**
- Create products and prices in Stripe Dashboard
- Set webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
- Add price IDs to environment variables

6. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
baby-photoshoot-app/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API routes
│   │   ├── children/             # Child profile management
│   │   ├── photoshoot/           # Photoshoot creation and management
│   │   ├── stripe/               # Payment processing
│   │   └── webhooks/             # Webhook handlers
│   ├── create/                   # Photoshoot creation flow
│   ├── dashboard/                # User dashboard
│   ├── gallery/                  # Photo gallery
│   ├── session/[sessionId]/      # Individual session view
│   ├── sign-in/                  # Authentication pages
│   ├── sign-up/
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable React components
│   ├── GalleryView.tsx
│   ├── PricingModal.tsx
│   └── SessionView.tsx
├── lib/                          # Utility libraries
│   ├── astria.ts                 # Astria.ai API integration
│   ├── supabase.ts               # Supabase client
│   └── utils.ts                  # Helper functions
├── types/                        # TypeScript type definitions
│   └── index.ts
├── supabase/                     # Database schema
│   └── schema.sql
├── middleware.ts                 # Clerk middleware
└── package.json
```

## 🔧 Configuration

### Astria.ai Setup
1. Sign up for Astria.ai account
2. Get your API key from the dashboard
3. Configure webhook endpoint: `https://your-domain.com/api/webhooks/astria`

### Supabase Setup
1. Create new Supabase project
2. Run the provided schema.sql
3. Configure Row Level Security policies
4. Set up storage bucket for image uploads (optional)

### Clerk Setup
1. Create Clerk application
2. Configure sign-in/sign-up pages
3. Set up OAuth providers
4. Configure webhooks for user sync

### Stripe Setup
1. Create products in Stripe Dashboard:
   - Free Plan (no charge)
   - Pro Plan ($9.99/month)
2. Set up webhook endpoints
3. Configure subscription management

## 🎨 Themes

The application includes several pre-designed themes:

- **Newborn in Bloom**: Soft florals and pastels
- **Superhero Adventure**: Heroic poses and colorful capes
- **Beach Day**: Sandy shores and sunshine vibes
- **Holiday Magic**: Festive winter wonderland
- **Garden Party**: Whimsical garden with butterflies
- **Cozy Nursery**: Soft nursery environment
- **Safari Adventure**: Wild safari with friendly animals
- **Starry Night**: Dreamy nighttime with stars

## 🔒 Security Features

- **Authentication**: Secure user authentication via Clerk
- **Authorization**: Row-level security with Supabase
- **Data Privacy**: Photos deleted after generation
- **Payment Security**: PCI-compliant via Stripe
- **API Security**: Rate limiting and input validation
- **Content Safety**: Baby-appropriate prompts and themes

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interfaces
- Mobile-optimized image uploads
- Progressive Web App features

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
```bash
npm i -g vercel
vercel
```

2. **Set environment variables in Vercel dashboard**

3. **Configure domains and SSL**

### Alternative Deployment Options
- **Netlify**: Full support with serverless functions
- **Railway**: Database and app hosting
- **DigitalOcean App Platform**: Container-based deployment

## 🔄 API Endpoints

### Authentication
- `POST /api/webhooks/clerk` - User sync webhook

### Children Management
- `GET /api/children` - List user's children
- `POST /api/children` - Create child profile

### Photoshoot Management
- `POST /api/photoshoot/create` - Create new photoshoot
- `GET /api/photoshoot/[sessionId]` - Get session details
- `POST /api/photoshoot/[sessionId]/generate` - Generate images

### Payments
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/webhooks/stripe` - Stripe webhook handler

### AI Integration
- `POST /api/webhooks/astria` - Astria.ai webhook handler

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 📊 Analytics Integration

The app is ready for analytics integration:

```typescript
// Add to your analytics provider
import { Analytics } from '@vercel/analytics/react'
// or
import { PostHogProvider } from 'posthog-js/react'
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Community**: Join our Discord for community support

## 🔮 Roadmap

- [ ] Video generation capabilities
- [ ] Advanced editing tools
- [ ] Batch processing
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Enterprise features

---

Built with ❤️ for creating magical memories of your little ones.
