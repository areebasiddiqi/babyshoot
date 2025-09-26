// This file is no longer needed as we've switched from Clerk to Supabase Auth
// User management is now handled directly in the AuthProvider component
export async function POST() {
  return new Response('Webhook no longer in use', { status: 200 })
}
