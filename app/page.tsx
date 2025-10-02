'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  SparklesIcon, 
  HeartIcon, 
  CameraIcon,
  StarIcon,
  CheckIcon,
  ClockIcon,
  ShieldCheckIcon,
  PhotoIcon,
  UserGroupIcon,
  LightBulbIcon,
  GiftIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/components/AuthProvider'

const features = [
  {
    icon: LightBulbIcon,
    title: 'Unmatched',
    description: 'Our AI technology creates the most realistic and beautiful baby portraits you\'ve ever seen.'
  },
  {
    icon: ClockIcon,
    title: 'AI & Training',
    description: 'Advanced machine learning models trained specifically for baby photography and safety.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Satisfaction',
    description: '99% of parents are thrilled with their AI-generated baby photos. Join thousands of happy families.'
  }
]

const howItWorks = [
  {
    step: '01',
    title: 'Upload Your Photos',
    description: 'Share 5-10 clear photos of your baby from different angles and expressions.',
    icon: PhotoIcon
  },
  {
    step: '02',
    title: 'AI Magic Begins',
    description: 'Our advanced AI analyzes and learns your baby\'s unique features and characteristics.',
    icon: SparklesIcon
  },
  {
    step: '03',
    title: 'Download & Share',
    description: 'Receive stunning, professional-quality photos ready for printing and sharing.',
    icon: GiftIcon
  }
]

const benefits = [
  {
    title: 'Daily Quality',
    description: 'Professional-grade photos every single day',
    icon: StarIcon
  },
  {
    title: 'AI Training',
    description: 'Continuously improving AI models',
    icon: LightBulbIcon
  },
  {
    title: 'Best Resolution',
    description: 'High-resolution images perfect for printing',
    icon: PhotoIcon
  }
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Mother of 2',
    text: 'BabyShoot AI created the most beautiful photos of my newborn. The quality is incredible and the process was so easy!',
    rating: 5,
    avatar: '👩‍🦰'
  },
  {
    name: 'Michael Chen',
    role: 'First-time Dad',
    text: 'I was skeptical at first, but the results blew me away. These photos will be treasured for generations.',
    rating: 5,
    avatar: '👨‍💼'
  },
  {
    name: 'Emma Rodriguez',
    role: 'Photography Enthusiast',
    text: 'As someone who loves photography, I\'m amazed by the AI\'s ability to capture emotion and personality.',
    rating: 5,
    avatar: '👩‍🎨'
  }
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold text-gray-900">BabyShoot AI</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">How it Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
            </div>
            
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Link href="/sign-in" className="text-gray-600 hover:text-gray-900 font-medium">
                    Sign In
                  </Link>
                  <Link href="/sign-up" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Get Started
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Professional
                <span className="text-primary-600"> Baby</span>
                <br />
                Photos in
                <br />
                <span className="text-primary-600">Minutes</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your baby photos into stunning professional portraits with our AI-powered technology. 
                Safe, secure, and incredibly realistic results in just minutes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {!user ? (
                  <Link href="/sign-up" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                    Start Free Trial
                  </Link>
                ) : (
                  <Link href="/dashboard" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                    Go to Dashboard
                  </Link>
                )}
                <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200">
                  View Examples
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>5-minute setup</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl p-8 shadow-2xl">
                <div className="aspect-square bg-white rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <CameraIcon className="h-20 w-20 text-primary-400 mx-auto mb-4" />
                    <p className="text-primary-600 font-semibold">Beautiful Baby Photos</p>
                    <p className="text-gray-500 text-sm mt-2">Generated by AI</p>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg">
                <SparklesIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-4 shadow-lg">
                <HeartIcon className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Why Parents Love BabyShoot AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of parents who trust our AI technology to create beautiful, 
              professional baby photos safely and affordably.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{benefit.title}</h4>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your baby photos into professional portraits in three simple steps. 
              Our AI does all the heavy lifting while you enjoy the magic.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <step.icon className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Process Flow */}
          <div className="mt-16 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-3xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Advanced AI Magic
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Our state-of-the-art AI analyzes facial features, lighting, and composition 
                to create stunning, photorealistic portraits that capture your baby's unique personality.
              </p>
              <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
                <span>✨ Face Recognition</span>
                <span>•</span>
                <span>🎨 Style Transfer</span>
                <span>•</span>
                <span>📸 Professional Enhancement</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              What Parents Are Saying
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of happy families who have created beautiful memories with BabyShoot AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Beautiful Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan for your family. Start free and upgrade anytime 
              to unlock more magical features.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-colors">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="text-5xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Perfect for trying out</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  '1 photoshoot session',
                  '4 AI-generated photos',
                  '5 theme options',
                  'Standard resolution',
                  'Email support'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {!user ? (
                <Link href="/sign-up" className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 px-6 rounded-xl font-semibold text-center block transition-colors">
                  Get Started Free
                </Link>
              ) : (
                <Link href="/dashboard" className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 px-6 rounded-xl font-semibold text-center block transition-colors">
                  Go to Dashboard
                </Link>
              )}
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl p-8 text-white relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-5xl font-bold mb-2">$1</div>
                <p className="text-primary-100">Per credit • Pay as you go</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited photoshoot sessions',
                  '8 high-quality photos per session',
                  'All premium themes',
                  'High resolution (1024x1024)',
                  'Priority support',
                  'Commercial usage rights'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-white mr-3 flex-shrink-0" />
                    <span className="text-primary-50">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/billing" className="w-full bg-white text-primary-600 hover:bg-gray-50 py-4 px-6 rounded-xl font-semibold text-center block transition-colors">
                Buy Credits
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-colors">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-5xl font-bold text-gray-900 mb-2">Custom</div>
                <p className="text-gray-600">For photography studios</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited everything',
                  'Custom AI model training',
                  'White-label solution',
                  'API access',
                  'Dedicated support',
                  'Custom integrations'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 px-6 rounded-xl font-semibold transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-secondary-600/20"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Create Magic?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of parents who have already created beautiful, professional baby photos 
            with our AI technology. Start your journey today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {!user ? (
              <Link href="/sign-up" className="bg-white text-primary-600 hover:bg-gray-50 font-bold py-5 px-10 rounded-2xl text-lg transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-105">
                Start Free Trial
              </Link>
            ) : (
              <Link href="/dashboard" className="bg-white text-primary-600 hover:bg-gray-50 font-bold py-5 px-10 rounded-2xl text-lg transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-105">
                Go to Dashboard
              </Link>
            )}
            <button className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold py-5 px-10 rounded-2xl text-lg transition-all duration-200">
              Watch Demo
            </button>
          </div>

          <div className="flex justify-center items-center space-x-8 text-white/80 text-sm">
            <div className="flex items-center space-x-2">
              <CheckIcon className="h-5 w-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckIcon className="h-5 w-5" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckIcon className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <SparklesIcon className="h-10 w-10 text-primary-400" />
                <span className="text-2xl font-bold">BabyShoot AI</span>
              </div>
              <p className="text-gray-400 text-lg mb-6 max-w-md">
                Creating magical baby memories with the power of AI. 
                Professional photos in minutes, not hours.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <span className="sr-only">Twitter</span>
                  📱
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <span className="sr-only">Instagram</span>
                  📸
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <span className="sr-only">Facebook</span>
                  👥
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Examples</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 BabyShoot AI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
