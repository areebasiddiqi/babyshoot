import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import AuthProvider from '@/components/AuthProvider'
import QueryProvider from '@/components/QueryProvider'
import './globals.css'

// Initialize the status checker on server startup
// import '@/lib/startup' // Disabled to prevent build issues

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BabyShoot AI - Magical Baby Photoshoots',
  description: 'Create stunning, professional baby photoshoots with AI. Safe, beautiful, and personalized for your little one.',
  keywords: 'baby photoshoot, AI photography, baby photos, newborn photography, family photos',
  authors: [{ name: 'BabyShoot AI Team' }],
  openGraph: {
    title: 'BabyShoot AI - Magical Baby Photoshoots',
    description: 'Create stunning, professional baby photoshoots with AI',
    url: 'https://babyshoot.ai',
    siteName: 'BabyShoot AI',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BabyShoot AI',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BabyShoot AI - Magical Baby Photoshoots',
    description: 'Create stunning, professional baby photoshoots with AI',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
