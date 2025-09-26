# Migration from Clerk to Supabase Auth

This document outlines the changes made to switch the authentication system from Clerk to Supabase Auth.

## Changes Made

### 1. Package Dependencies
**Removed:**
- `@clerk/nextjs`
- `svix` (for Clerk webhooks)

**Added:**
- `@supabase/auth-helpers-nextjs`
- `@supabase/auth-helpers-react`
- `@supabase/auth-ui-react`
- `@supabase/auth-ui-shared`

### 2. Environment Variables
**Removed:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
CLERK_WEBHOOK_SECRET
```

**Kept (already existed):**
```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### 3. Authentication Components

#### AuthProvider (`components/AuthProvider.tsx`)
- New component that wraps the app and provides authentication context
- Handles user session management
- Automatically syncs users to the database on sign-in
- Creates free subscriptions for new users

#### AuthForm (`components/AuthForm.tsx`)
- Unified component for both sign-in and sign-up
- Uses Supabase Auth UI components
- Supports email/password and Google OAuth
- Responsive design matching the original Clerk styling

### 4. Updated Files

#### Core Layout (`app/layout.tsx`)
- Replaced `ClerkProvider` with custom `AuthProvider`
- Removed Clerk-specific imports

#### Landing Page (`app/page.tsx`)
- Replaced Clerk auth components with custom auth logic
- Uses `useAuth` hook instead of Clerk's auth state
- Updated all authentication-related buttons and links

#### Dashboard (`app/dashboard/page.tsx`)
- Replaced `currentUser()` from Clerk with Supabase session
- Updated user property access (e.g., `user.firstName` → `user.user_metadata?.first_name`)
- Uses `createSupabaseServerClient` for server-side auth

#### Authentication Pages
- `app/sign-in/[[...sign-in]]/page.tsx`: Now uses `AuthForm` component
- `app/sign-up/[[...sign-up]]/page.tsx`: Now uses `AuthForm` component

#### Middleware (`middleware.ts`)
- Replaced Clerk's `authMiddleware` with Supabase auth middleware
- Uses `createMiddlewareClient` for session management
- Handles route protection and redirects

#### Supabase Client (`lib/supabase.ts`)
- Added auth helper functions
- Includes client, server, and middleware clients
- Maintains existing admin client for database operations

### 5. New Routes

#### Auth Callback (`app/auth/callback/route.ts`)
- Handles OAuth redirects from Supabase
- Exchanges authorization codes for sessions
- Redirects users to intended destinations

### 6. Database Integration

The existing Supabase database schema remains unchanged. User management now happens through:

1. **Automatic User Sync**: When users sign in, their data is automatically synced to the `users` table
2. **Subscription Creation**: New users automatically get a free subscription
3. **Session Management**: All handled through Supabase Auth instead of Clerk

### 7. Authentication Flow

**New Flow:**
1. User visits sign-in/sign-up page
2. Supabase Auth UI handles authentication
3. On success, user is redirected to auth callback
4. Callback exchanges code for session
5. AuthProvider syncs user data to database
6. User is redirected to dashboard

### 8. Benefits of Migration

1. **Unified Stack**: Everything now runs on Supabase (auth + database)
2. **Cost Reduction**: No separate Clerk subscription needed
3. **Simplified Architecture**: Fewer external dependencies
4. **Better Integration**: Direct integration with existing Supabase database
5. **OAuth Support**: Still supports Google OAuth and other providers

### 9. Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install @supabase/auth-helpers-nextjs @supabase/auth-helpers-react @supabase/auth-ui-react @supabase/auth-ui-shared
   ```

2. **Configure Supabase Auth:**
   - Enable authentication in Supabase dashboard
   - Configure OAuth providers (Google, etc.)
   - Set up redirect URLs

3. **Environment Variables:**
   - Remove all Clerk-related variables
   - Ensure Supabase variables are set

4. **Database Setup:**
   - Run the existing `supabase/schema.sql`
   - No changes needed to existing schema

### 10. Migration Checklist

- [x] Update package.json dependencies
- [x] Create AuthProvider component
- [x] Create AuthForm component
- [x] Update middleware for Supabase Auth
- [x] Update all pages to use new auth system
- [x] Create auth callback route
- [x] Update environment variables
- [x] Remove Clerk webhook handler
- [x] Test authentication flow
- [ ] Configure OAuth providers in Supabase
- [ ] Update deployment configuration
- [ ] Test in production

### 11. Testing

After migration, test the following:
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Google OAuth sign-in
- [ ] Route protection (accessing protected routes without auth)
- [ ] User data sync to database
- [ ] Subscription creation for new users
- [ ] Sign out functionality
- [ ] Session persistence across page refreshes

The migration maintains all existing functionality while simplifying the authentication architecture and reducing external dependencies.
