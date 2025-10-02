'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface GeneratedImage {
  id: string
  image_url: string
  prompt: string
  photoshoot_sessions: {
    id: string
    themes: { name: string }
    children?: { name: string }
  }
}

interface ImageSelectorProps {
  onClose: () => void
  onSelect: (imageIds: string[]) => void
  excludeImageIds?: string[]
}

export default function ImageSelector({ onClose, onSelect, excludeImageIds = [] }: ImageSelectorProps) {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images/user-images')
      if (response.ok) {
        const data = await response.json()
        // Filter out images that are already in the album
        const availableImages = data.filter((img: GeneratedImage) => 
          !excludeImageIds.includes(img.id)
        )
        setImages(availableImages)
      } else {
        toast.error('Failed to load images')
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      toast.error('Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  const toggleImageSelection = (imageId: string) => {
    setSelectedImageIds(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const handleSelect = () => {
    if (selectedImageIds.length === 0) {
      toast.error('Please select at least one image')
      return
    }
    onSelect(selectedImageIds)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Select Images for Album</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading images...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No images available to add</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIds.includes(image.id)
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <div className="aspect-square">
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {selectedImageIds.includes(image.id) && (
                    <div className="absolute inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                        ✓
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                    <p className="text-xs truncate">{image.photoshoot_sessions.themes.name}</p>
                    {image.photoshoot_sessions.children && (
                      <p className="text-xs opacity-75">{image.photoshoot_sessions.children.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedImageIds.length} image(s) selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              className="btn-primary"
              disabled={selectedImageIds.length === 0}
            >
              Add Selected Images
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
