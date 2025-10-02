import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

if (!supabaseServiceRoleKey) {
  console.warn('Missing SUPABASE_SERVICE_ROLE_KEY environment variable - admin operations will not work')
}

// Lazy-loaded clients to prevent build-time instantiation
let _supabase: any = null
let _supabaseAdmin: any = null

// Client-side Supabase client (lazy-loaded)
export const supabase = {
  get instance() {
    if (!_supabase) {
      _supabase = createClient(supabaseUrl!, supabaseAnonKey!)
    }
    return _supabase
  }
}

// Client component client (for use in client components)
export const createSupabaseClient = () => createClientComponentClient()

// Server component client (for use in server components)
export const createSupabaseServerClient = () => {
  const { cookies } = require('next/headers')
  return createServerComponentClient({ cookies })
}

// Server-side client with service role key (for admin operations) - lazy-loaded
export const supabaseAdmin = {
  get instance() {
    if (!_supabaseAdmin && supabaseServiceRoleKey) {
      _supabaseAdmin = createClient(
        supabaseUrl!,
        supabaseServiceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    }
    return _supabaseAdmin
  }
}
