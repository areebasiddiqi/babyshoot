'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Album {
  id: string
  title: string
  album_images: any[]
}

const ALBUM_SIZES = [
  { id: '5x7', name: '5" x 7"', price: 29.99, description: 'Perfect for gifts' },
  { id: '8x10', name: '8" x 10"', price: 39.99, description: 'Most popular size' },
  { id: '11x14', name: '11" x 14"', price: 59.99, description: 'Premium large format' }
]

const COVER_TYPES = [
  { id: 'softcover', name: 'Softcover', price: 0, description: 'Durable matte finish' },
  { id: 'hardcover', name: 'Hardcover', price: 15, description: 'Premium hardbound' },
  { id: 'premium', name: 'Premium Leather', price: 35, description: 'Luxury leather cover' }
]

export default function OrderAlbumPage({ params }: { params: { albumId: string } }) {
  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  
  // Order form state
  const [albumSize, setAlbumSize] = useState('8x10')
  const [coverType, setCoverType] = useState('hardcover')
  const [shippingName, setShippingName] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    fetchAlbum()
  }, [params.albumId])

  const fetchAlbum = async () => {
    try {
      const response = await fetch(`/api/albums/${params.albumId}`)
      if (response.ok) {
        const data = await response.json()
        setAlbum(data)
      } else {
        toast.error('Album not found')
        router.push('/albums')
      }
    } catch (error) {
      console.error('Error fetching album:', error)
      toast.error('Failed to load album')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    const sizePrice = ALBUM_SIZES.find(s => s.id === albumSize)?.price || 0
    const coverPrice = COVER_TYPES.find(c => c.id === coverType)?.price || 0
    const shippingCost = 9.99
    return sizePrice + coverPrice + shippingCost
  }

  const handleOrder = async () => {
    if (!shippingName.trim() || !shippingAddress.trim()) {
      toast.error('Please fill in all shipping information')
      return
    }

    if (!album?.album_images || album.album_images.length === 0) {
      toast.error('Album must have at least one image')
      return
    }

    setOrdering(true)
    try {
      const response = await fetch(`/api/albums/${params.albumId}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumSize,
          coverType,
          shippingName,
          shippingAddress,
          totalAmount: calculateTotal()
        })
      })

      if (response.ok) {
        const order = await response.json()
        toast.success('Order created! Redirecting to payment...')
        router.push(`/albums/${params.albumId}/order/${order.id}/payment`)
      } else {
        toast.error('Failed to create order')
      }
    } catch (error) {
      toast.error('Failed to place order')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!album) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/albums/${params.albumId}`)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Physical Album</h1>
            <p className="text-gray-600 mt-1">"{album.title}" - {album.album_images.length} photos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Album Options</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Album Size</label>
                  <div className="space-y-2">
                    {ALBUM_SIZES.map((size) => (
                      <label key={size.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="albumSize"
                          value={size.id}
                          checked={albumSize === size.id}
                          onChange={(e) => setAlbumSize(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{size.name}</span>
                            <span className="text-primary-600 font-semibold">${size.price}</span>
                          </div>
                          <p className="text-sm text-gray-600">{size.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Type</label>
                  <div className="space-y-2">
                    {COVER_TYPES.map((cover) => (
                      <label key={cover.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="coverType"
                          value={cover.id}
                          checked={coverType === cover.id}
                          onChange={(e) => setCoverType(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{cover.name}</span>
                            <span className="text-primary-600 font-semibold">
                              {cover.price === 0 ? 'Included' : `+$${cover.price}`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{cover.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Address</label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="input-field w-full"
                    rows={4}
                    placeholder="Enter your complete shipping address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Album ({ALBUM_SIZES.find(s => s.id === albumSize)?.name})</span>
                  <span>${ALBUM_SIZES.find(s => s.id === albumSize)?.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cover ({COVER_TYPES.find(c => c.id === coverType)?.name})</span>
                  <span>
                    {COVER_TYPES.find(c => c.id === coverType)?.price === 0 
                      ? 'Included' 
                      : `$${COVER_TYPES.find(c => c.id === coverType)?.price}`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>$9.99</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={ordering || !shippingName.trim() || !shippingAddress.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {ordering ? 'Placing Order...' : 'Place Order'}
            </button>

            <div className="text-sm text-gray-600 space-y-2">
              <p>• High-quality photo paper and printing</p>
              <p>• Professional binding and finishing</p>
              <p>• Ships within 5-7 business days</p>
              <p>• Free shipping on orders over $50</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
