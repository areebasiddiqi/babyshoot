'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PhotoIcon, EyeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Album {
  id: string
  title: string
  description: string
  cover_image_url: string
  status: string
  created_at: string
  album_images: { count: number }[]
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAlbumTitle, setNewAlbumTitle] = useState('')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchAlbums()
  }, [])

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/albums')
      if (response.ok) {
        const data = await response.json()
        setAlbums(data)
      }
    } catch (error) {
      console.error('Error fetching albums:', error)
      toast.error('Failed to load albums')
    } finally {
      setLoading(false)
    }
  }

  const createAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      toast.error('Album title is required')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAlbumTitle,
          description: newAlbumDescription
        })
      })

      if (response.ok) {
        const album = await response.json()
        setAlbums([album, ...albums])
        setShowCreateModal(false)
        setNewAlbumTitle('')
        setNewAlbumDescription('')
        toast.success('Album created successfully!')
        router.push(`/albums/${album.id}`)
      } else {
        toast.error('Failed to create album')
      }
    } catch (error) {
      toast.error('Failed to create album')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading albums...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Albums</h1>
              <p className="text-gray-600 mt-2">Create beautiful photo albums from your photoshoots</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Album
          </button>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No albums yet</h3>
            <p className="text-gray-600 mb-6">Create your first album to organize your favorite photos</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Album
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <div key={album.id} className="card hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => router.push(`/albums/${album.id}`)}>
                <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                  {album.cover_image_url ? (
                    <img 
                      src={album.cover_image_url} 
                      alt={album.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <PhotoIcon className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{album.title}</h3>
                  {album.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{album.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{album.album_images?.[0]?.count || 0} photos</span>
                    <span className="capitalize">{album.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Album Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-4">Create New Album</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Album Title *
                  </label>
                  <input
                    type="text"
                    value={newAlbumTitle}
                    onChange={(e) => setNewAlbumTitle(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter album title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newAlbumDescription}
                    onChange={(e) => setNewAlbumDescription(e.target.value)}
                    className="input-field w-full"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={createAlbum}
                  className="btn-primary flex-1"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Album'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
