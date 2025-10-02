'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClockIcon, CheckCircleIcon, TruckIcon, XCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Order {
  id: string
  album_id: string
  album_size: string
  cover_type: string
  total_amount: number
  status: string
  shipping_name: string
  shipping_address: string
  created_at: string
  albums: {
    title: string
    album_images: { count: number }[]
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        toast.error('Failed to load orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />
      case 'shipped':
        return <TruckIcon className="h-5 w-5 text-green-500" />
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Payment Pending'
      case 'paid': return 'Payment Received'
      case 'processing': return 'Being Processed'
      case 'shipped': return 'Shipped'
      case 'delivered': return 'Delivered'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">Track your album orders and shipping status</p>
          </div>
          <button
            onClick={() => router.push('/albums')}
            className="btn-secondary"
          >
            Back to Albums
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <TruckIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Create an album and order a physical copy to see it here</p>
            <button
              onClick={() => router.push('/albums')}
              className="btn-primary"
            >
              Browse Albums
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(order.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.albums.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Size:</span> {order.album_size}</p>
                          <p><span className="font-medium">Cover:</span> {order.cover_type}</p>
                          <p><span className="font-medium">Photos:</span> {order.albums.album_images?.[0]?.count || 0}</p>
                          <p><span className="font-medium">Total:</span> ${order.total_amount.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{order.shipping_name}</p>
                          <p className="whitespace-pre-line">{order.shipping_address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <p>Ordered on</p>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {order.status === 'shipped' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      🎉 Your album has been shipped! You should receive it within 3-5 business days.
                    </p>
                  </div>
                )}
                
                {order.status === 'pending' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                    <p className="text-sm text-yellow-800">
                      💳 Payment required to process your order
                    </p>
                    <button
                      onClick={() => router.push(`/albums/${order.album_id}/order/${order.id}/payment`)}
                      className="btn-primary btn-sm flex items-center gap-2"
                    >
                      <CreditCardIcon className="h-4 w-4" />
                      Pay Now
                    </button>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ Your album has been delivered! We hope you love your beautiful photos.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
