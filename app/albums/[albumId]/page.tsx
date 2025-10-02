'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, PlusIcon, TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import ImageSelector from '@/components/albums/ImageSelector'

interface AlbumImage {
  id: string
  position: number
  generated_images: {
    id: string
    image_url: string
    prompt: string
  }
}

interface Album {
  id: string
  title: string
  description: string
  status: string
  album_images: AlbumImage[]
}

export default function AlbumPage({ params }: { params: { albumId: string } }) {
  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [showImageSelector, setShowImageSelector] = useState(false)
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

  const addImages = async (imageIds: string[]) => {
    try {
      const response = await fetch(`/api/albums/${params.albumId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds })
      })

      if (response.ok) {
        toast.success(`Added ${imageIds.length} image(s) to album`)
        fetchAlbum() // Refresh album data
        setShowImageSelector(false)
      } else {
        toast.error('Failed to add images')
      }
    } catch (error) {
      toast.error('Failed to add images')
    }
  }

  const removeImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/albums/${params.albumId}/images?imageId=${imageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Image removed from album')
        fetchAlbum()
      } else {
        toast.error('Failed to remove image')
      }
    } catch (error) {
      toast.error('Failed to remove image')
    }
  }

  const orderPhysicalCopy = () => {
    if (!album?.album_images || album.album_images.length === 0) {
      toast.error('Add some images to your album first')
      return
    }
    router.push(`/albums/${params.albumId}/order`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading album...</p>
        </div>
      </div>
    )
  }

  if (!album) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/albums')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{album.title}</h1>
            {album.description && (
              <p className="text-gray-600 mt-1">{album.description}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImageSelector(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Images
            </button>
            <button
              onClick={orderPhysicalCopy}
              className="btn-primary flex items-center gap-2"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              Order Physical Copy
            </button>
          </div>
        </div>

        {album.album_images && album.album_images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {album.album_images.map((albumImage) => (
              <div key={albumImage.id} className="relative group">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={albumImage.generated_images.image_url}
                    alt={albumImage.generated_images.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeImage(albumImage.generated_images.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  #{albumImage.position}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No images in this album</h3>
            <p className="text-gray-600 mb-6">Add some beautiful photos from your photoshoots</p>
            <button
              onClick={() => setShowImageSelector(true)}
              className="btn-primary"
            >
              Add Your First Images
            </button>
          </div>
        )}

        {/* Image Selector Modal */}
        {showImageSelector && (
          <ImageSelector
            onClose={() => setShowImageSelector(false)}
            onSelect={addImages}
            excludeImageIds={album.album_images?.map(ai => ai.generated_images.id) || []}
          />
        )}
      </div>
    </div>
  )
}
