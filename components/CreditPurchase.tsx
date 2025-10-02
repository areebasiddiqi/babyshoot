'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from 'react-hot-toast'
import { useCreditBalance } from '@/contexts/CreditContext'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'
import { 
  SparklesIcon, 
  CreditCardIcon,
  CheckIcon,
  StarIcon
} from '@heroicons/react/24/outline'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  priceCents: number
  description: string
  pricePerCredit: string
  savings: number
}

interface CreditPurchaseProps {
  currentBalance: number
}

function CheckoutForm({ selectedPackage, onSuccess }: { selectedPackage: CreditPackage | null, onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState<string | undefined>()
  const { refreshBalance } = useCreditBalance()

  // Use payment status hook to monitor payment completion
  usePaymentStatus({
    paymentIntentId,
    onPaymentSuccess: () => {
      toast.success(`Successfully purchased ${selectedPackage?.credits} credits!`)
      onSuccess()
    }
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !selectedPackage) {
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent) {
        // Store payment intent ID to monitor status
        setPaymentIntentId(paymentIntent.id)
        
        // Show processing message
        toast.loading('Processing payment...', { id: 'payment-processing' })
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!selectedPackage) {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900">{selectedPackage.name}</h4>
        <p className="text-sm text-gray-600">{selectedPackage.description}</p>
        <p className="text-lg font-bold text-primary-600 mt-2">
          ${selectedPackage.price} for {selectedPackage.credits} credits
        </p>
      </div>

      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay $${selectedPackage.price}`}
      </button>
    </form>
  )
}

export default function CreditPurchase({ currentBalance }: CreditPurchaseProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if Stripe is configured
  const isStripeConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  useEffect(() => {
    if (isStripeConfigured) {
      fetchPackages()
    } else {
      setLoading(false)
    }
  }, [isStripeConfigured])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/credits/packages')
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Failed to load credit packages')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseClick = (pkg: CreditPackage) => {
    setSelectedPackage(pkg)
    setShowCheckout(true)
  }

  const handleSuccess = () => {
    setShowCheckout(false)
    setSelectedPackage(null)
    // Balance is already refreshed in CheckoutForm
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Purchase Credits</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isStripeConfigured) {
    return (
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CreditCardIcon className="h-8 w-8 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Purchase Credits</h3>
              <p className="text-sm text-gray-500">Stripe configuration required</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <CreditCardIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Stripe Not Configured</h4>
            <p className="text-gray-600 mb-4">
              To enable credit purchases, please configure your Stripe API keys.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Required environment variables:</strong>
              </p>
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded block mb-1">
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
              </code>
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded block mb-1">
                STRIPE_SECRET_KEY=sk_test_...
              </code>
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded block">
                STRIPE_WEBHOOK_SECRET=whsec_...
              </code>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <CreditCardIcon className="h-8 w-8 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Purchase Credits</h3>
            <p className="text-sm text-gray-500">Choose a credit package to continue creating photoshoots</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!showCheckout ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative border rounded-lg p-6 hover:shadow-md transition-shadow ${
                  pkg.savings > 0 ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                }`}
              >
                {pkg.savings > 0 && (
                  <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    <StarIcon className="h-3 w-3 mr-1" />
                    {pkg.savings}% OFF
                  </div>
                )}
                
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900">{pkg.name}</h4>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${pkg.price}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {pkg.credits} credits • ${pkg.pricePerCredit} per credit
                  </p>
                  
                  <p className="text-sm text-gray-600 mt-3 mb-4">
                    {pkg.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <div className="flex items-center justify-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span>{pkg.credits} photoshoot sessions</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span>Never expires</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span>All themes included</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchaseClick(pkg)}
                    className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      pkg.savings > 0
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    Purchase Credits
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-medium text-gray-900">Complete Purchase</h4>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <Elements stripe={stripePromise}>
              <CheckoutForm selectedPackage={selectedPackage} onSuccess={handleSuccess} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  )
}
