'use client'

import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    priceId: null,
    description: 'Perfect for trying out',
    features: [
      '1 photoshoot per month',
      '4 generated images',
      '3 theme options',
      'Standard resolution',
      'Email support'
    ],
    buttonText: 'Current Plan',
    popular: false
  },
  {
    name: 'Pro',
    price: '$9.99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    description: 'For unlimited magic',
    features: [
      'Unlimited photoshoots',
      '8 generated images per shoot',
      'All theme options',
      'High resolution (1024x1024)',
      'Priority support',
      'Commercial license',
      'Early access to new features'
    ],
    buttonText: 'Upgrade to Pro',
    popular: true
  }
]

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async (priceId: string) => {
    if (!priceId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      const stripe = await stripePromise

      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          throw error
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout process')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                    Choose Your Plan
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <p className="text-gray-600 mb-8 text-center">
                  Upgrade to Pro for unlimited photoshoots and premium features
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`relative rounded-2xl border-2 p-6 ${
                        plan.popular
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                            <SparklesIcon className="h-4 w-4 mr-1" />
                            Most Popular
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <div className="text-4xl font-bold text-gray-900 mb-2">{plan.price}</div>
                        {plan.name === 'Pro' && (
                          <p className="text-gray-600">per month</p>
                        )}
                        <p className="text-gray-600 mt-2">{plan.description}</p>
                      </div>

                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => plan.priceId && handleUpgrade(plan.priceId)}
                        disabled={!plan.priceId || isLoading}
                        className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${
                          plan.popular
                            ? 'btn-primary'
                            : plan.priceId
                            ? 'btn-secondary'
                            : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isLoading && plan.priceId ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          plan.buttonText
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                  <p>
                    All plans include secure processing and automatic photo deletion after generation.
                    Cancel anytime.
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
