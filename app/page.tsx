'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  SparklesIcon, 
  HeartIcon, 
  CameraIcon,
  StarIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/components/AuthProvider'

const features = [
  {
    icon: SparklesIcon,
    title: 'AI-Powered Magic',
    description: 'Advanced AI creates stunning, photorealistic baby portraits tailored to your little one.'
  },
  {
    icon: HeartIcon,
    title: 'Safe & Secure',
    description: 'Your photos are processed securely and deleted after generation. Privacy first.'
  },
  {
    icon: CameraIcon,
    title: 'Professional Quality',
    description: 'High-resolution images perfect for printing, sharing, and treasuring forever.'
  }
]

const themes = [
  { name: 'Newborn in Bloom', image: '/themes/bloom.jpg', description: 'Soft florals and pastels' },
  { name: 'Superhero Adventure', image: '/themes/superhero.jpg', description: 'Heroic poses and capes' },
  { name: 'Beach Day', image: '/themes/beach.jpg', description: 'Sandy shores and sunshine' },
  { name: 'Holiday Magic', image: '/themes/holiday.jpg', description: 'Festive and cozy vibes' }
]

const testimonials = [
  {
    name: 'Sarah M.',
    rating: 5,
    text: 'Absolutely magical! The AI captured my baby\'s personality perfectly. These photos will be treasured forever.'
  },
  {
    name: 'Mike & Lisa',
    rating: 5,
    text: 'We were amazed by the quality and creativity. Much more affordable than traditional photoshoots!'
  },
  {
    name: 'Emma K.',
    rating: 5,
    text: 'The themes are so creative and the results exceeded our expectations. Highly recommend!'
  }
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold gradient-text">BabyShoot AI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Link href="/sign-in" className="btn-secondary">
                    Sign In
                  </Link>
                  <Link href="/sign-up" className="btn-primary">
                    Get Started
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Magical Baby Photoshoots
              <span className="block gradient-text">Powered by AI</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto text-balance">
              Create stunning, professional baby portraits in minutes. Upload a few photos and watch AI transform them into beautiful, themed photoshoots perfect for your little one.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {!user ? (
                <Link href="/sign-up" className="btn-primary text-lg px-8 py-4">
                  Start Creating Magic ✨
                </Link>
              ) : (
                <Link href="/dashboard" className="btn-primary text-lg px-8 py-4">
                  Go to Dashboard
                </Link>
              )}
              <button className="btn-secondary text-lg px-8 py-4">
                View Examples
              </button>
            </div>

            {/* Hero Image/Video Placeholder */}
            <div className="relative max-w-4xl mx-auto">
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <CameraIcon className="h-16 w-16 text-primary-400 mx-auto mb-4" />
                  <p className="text-primary-600 font-medium">Demo Video Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BabyShoot AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional-quality baby photography made simple, safe, and affordable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <feature.icon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Themes Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Beautiful Themes for Every Moment
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from our curated collection of baby-safe, adorable themes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {themes.map((theme, index) => (
              <div key={index} className="card group cursor-pointer hover:scale-105 transition-transform">
                <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl mb-4 flex items-center justify-center">
                  <SparklesIcon className="h-12 w-12 text-primary-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{theme.name}</h3>
                <p className="text-sm text-gray-600">{theme.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create magical baby photos in just three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Upload Photos',
                description: 'Share 5-10 clear photos of your baby from different angles.'
              },
              {
                step: '2',
                title: 'Choose Theme',
                description: 'Select from our collection of beautiful, baby-safe themes.'
              },
              {
                step: '3',
                title: 'Get Magic',
                description: 'Receive stunning, high-resolution photos in minutes!'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by Parents Everywhere
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                <p className="font-semibold text-gray-900">- {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more magic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="card border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Perfect for trying out</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  '1 photoshoot per month',
                  '4 generated images',
                  '3 theme options',
                  'Standard resolution',
                  'Email support'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {!user ? (
                <Link href="/sign-up" className="btn-secondary w-full text-center">
                  Get Started Free
                </Link>
              ) : (
                <Link href="/dashboard" className="btn-secondary w-full text-center">
                  Go to Dashboard
                </Link>
              )}
            </div>

            {/* Pro Plan */}
            <div className="card border-2 border-primary-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$9.99</div>
                <p className="text-gray-600">Per month</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited photoshoots',
                  '8 generated images per shoot',
                  'All theme options',
                  'High resolution (1024x1024)',
                  'Priority support',
                  'Commercial license'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className="btn-primary w-full">Upgrade to Pro</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Create Magic?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of parents creating beautiful memories with AI.
          </p>
          
          {!user ? (
            <Link href="/sign-up" className="bg-white text-primary-600 hover:bg-gray-50 font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Your Free Photoshoot
            </Link>
          ) : (
            <Link href="/dashboard" className="bg-white text-primary-600 hover:bg-gray-50 font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <SparklesIcon className="h-8 w-8 text-primary-400" />
                <span className="text-xl font-bold">BabyShoot AI</span>
              </div>
              <p className="text-gray-400">
                Creating magical baby memories with the power of AI.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Themes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Examples</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BabyShoot AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
