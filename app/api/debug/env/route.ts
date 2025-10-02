import { NextResponse } from 'next/server'

export async function GET() {
  // Only show this in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    // Show first few characters to verify it's the right key
    SUPABASE_URL_PREVIEW: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    ANON_KEY_PREVIEW: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
  })
}
