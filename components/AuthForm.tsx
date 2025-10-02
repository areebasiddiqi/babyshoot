'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const supabase = createSupabaseClient()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setIsLoading(true)
      router.push(redirectTo)
    }
  }, [user, router, redirectTo])

  // Listen for auth state changes to show loading
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setIsLoading(true)
      } else if (event === 'SIGNED_OUT') {
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const isSignIn = mode === 'sign-in'

  return (
    <div className="min-h-screen flex relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-6">
              <SparklesIcon className="h-12 w-12 text-primary-500 mx-auto animate-spin" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 opacity-20 rounded-full animate-ping"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h3>
            <p className="text-gray-600">Redirecting to your dashboard</p>
          </div>
        </div>
      )}
      
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-secondary-500 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center space-x-2 text-white">
            <SparklesIcon className="h-8 w-8" />
            <span className="text-2xl font-bold">BabyShoot AI</span>
          </Link>
        </div>
        
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-6">
            {isSignIn ? 'Welcome back to the magic! ✨' : 'Start creating magic today! ✨'}
          </h1>
          <p className="text-xl text-white/90 mb-8">
            {isSignIn 
              ? 'Continue creating beautiful memories for your little one.'
              : 'Join thousands of parents creating beautiful baby memories with AI.'
            }
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>
                {isSignIn ? 'AI-powered baby photoshoots' : 'Free to start - no credit card required'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>
                {isSignIn ? 'Safe and secure processing' : 'Professional quality in minutes'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>
                {isSignIn ? 'Professional quality results' : 'Safe, secure, and private'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-white/70 text-sm">
          {isSignIn 
            ? 'Trusted by thousands of parents worldwide'
            : 'Your photos are processed securely and deleted after generation'
          }
        </div>
      </div>
      
      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="flex items-center justify-center space-x-2 text-primary-600 mb-4">
              <SparklesIcon className="h-8 w-8" />
              <span className="text-2xl font-bold">BabyShoot AI</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isSignIn ? 'Welcome back!' : 'Get started for free'}
            </h1>
          </div>
          
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isSignIn ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="text-gray-600">
              {isSignIn 
                ? 'Welcome back! Please sign in to continue.'
                : 'Start creating magical baby photoshoots today.'
              }
            </p>
          </div>

          <Auth
            supabaseClient={supabase}
            view={isSignIn ? 'sign_in' : 'sign_up'}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#f1771a',
                    brandAccent: '#e25d10',
                  },
                },
              },
              className: {
                container: 'w-full',
                button: 'btn-primary w-full',
                input: 'input-field',
                label: 'block text-sm font-medium text-gray-700 mb-2',
                message: 'text-red-500 text-sm mt-1',
                anchor: 'text-primary-600 hover:text-primary-700 font-medium',
              },
              style: {
                button: { color: 'white' },
              },
            }}
            providers={['google']}
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/callback'}
            onlyThirdPartyProviders={false}
            magicLink={false}
            showLinks={false}
          />
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
              <Link 
                href={isSignIn ? '/sign-up' : '/sign-in'} 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {isSignIn ? 'Sign up for free' : 'Sign in'}
              </Link>
            </p>
          </div>
          
          {!isSignIn && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              By signing up, you agree to our{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
