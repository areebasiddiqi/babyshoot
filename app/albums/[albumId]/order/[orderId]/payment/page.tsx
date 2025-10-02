'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Order {
  id: string
  album_id: string
  total_amount: number
  status: string
  album_size: string
  cover_type: string
  shipping_name: string
  shipping_address: string
  albums: {
    title: string
    album_images: { count: number }[]
  }
}

function PaymentForm({ order, onSuccess }: { order: Order; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent()
  }, [])

  const createPaymentIntent = async () => {
    try {
      const response = await fetch(`/api/albums/${order.album_id}/order/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      })

      if (response.ok) {
        const { clientSecret } = await response.json()
        setClientSecret(clientSecret)
      } else {
        toast.error('Failed to initialize payment')
      }
    } catch (error) {
      toast.error('Failed to initialize payment')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setProcessing(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setProcessing(false)
      return
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: order.shipping_name,
        },
      },
    })

    if (error) {
      toast.error(error.message || 'Payment failed')
      setProcessing(false)
    } else if (paymentIntent.status === 'succeeded') {
      toast.success('Payment successful!')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
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
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <CreditCardIcon className="h-5 w-5" />
        {processing ? 'Processing...' : `Pay $${order.total_amount.toFixed(2)}`}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>Your payment is secured by Stripe</p>
        <p>We never store your card information</p>
      </div>
    </form>
  )
}

export default function PaymentPage({ 
  params 
}: { 
  params: { albumId: string; orderId: string } 
}) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOrder()
  }, [params.orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.orderId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.status !== 'pending') {
          toast.error('This order is not pending payment')
          router.push('/orders')
          return
        }
        setOrder(data)
      } else {
        toast.error('Order not found')
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    router.push('/orders?payment=success')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/orders')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
            <p className="text-gray-600 mt-1">Order #{order.id.slice(-8)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">{order.albums.title}</h4>
                <p className="text-sm text-gray-600">{order.albums.album_images?.[0]?.count || 0} photos</p>
              </div>
              
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Album Size:</span>
                  <span>{order.album_size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cover Type:</span>
                  <span>{order.cover_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>$9.99</span>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-primary-600">${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
              <p className="text-sm text-gray-600">
                <span className="font-medium">{order.shipping_name}</span><br />
                <span className="whitespace-pre-line">{order.shipping_address}</span>
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <Elements stripe={stripePromise}>
              <PaymentForm order={order} onSuccess={handlePaymentSuccess} />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  )
}
