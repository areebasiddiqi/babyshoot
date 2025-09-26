'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle sign in
        if (event === 'SIGNED_IN' && session?.user) {
          // Sync user to database
          await syncUserToDatabase(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const syncUserToDatabase = async (user: User) => {
    try {
      // Use the sync profile API endpoint for better reliability
      const response = await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Failed to sync user profile via API')
        
        // Fallback to direct database sync
        const { error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || '',
            last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
            image_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            updated_at: new Date().toISOString(),
          })

        if (error) {
          console.error('Error syncing user to database:', error)
        }
      } else {
        const data = await response.json()
        console.log('User profile synced successfully:', data.message)
      }
    } catch (error) {
      console.error('Error in syncUserToDatabase:', error)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
