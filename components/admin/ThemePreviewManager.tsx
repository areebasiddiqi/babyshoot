'use client'

import { useState, useEffect } from 'react'
import { 
  PhotoIcon, 
  PlusIcon, 
  TrashIcon, 
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import ThemePreviewModal from '@/components/ThemePreviewModal'
import { Theme } from '@/types'

interface ThemePreviewManagerProps {
  themeId: string
  themeName: string
  initialPreviewImages?: string[]
}

export default function ThemePreviewManager({ 
  themeId, 
  themeName, 
  initialPreviewImages = [] 
}: ThemePreviewManagerProps) {
  const [previewImages, setPreviewImages] = useState<string[]>(initialPreviewImages)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  // Create a mock theme object for the preview modal
  const mockTheme: Theme = {
    id: themeId,
    name: themeName,
    description: 'Theme preview',
    prompt: '',
    thumbnailUrl: '',
    category: 'fantasy',
    isActive: true,
    previewImages: previewImages
  }

  useEffect(() => {
    fetchPreviewImages()
  }, [themeId])

  const fetchPreviewImages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/themes/${themeId}/preview-images`)
      if (response.ok) {
        const data = await response.json()
        setPreviewImages(data.previewImages || [])
      } else {
        setMessage({ type: 'error', text: 'Failed to load preview images' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading preview images' })
    } finally {
      setIsLoading(false)
    }
  }

  const savePreviewImages = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/themes/${themeId}/preview-images`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ previewImages }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preview images saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save preview images' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving preview images' })
    } finally {
      setIsSaving(false)
    }
  }

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return
    
    // Basic URL validation
    try {
      new URL(newImageUrl)
    } catch {
      setMessage({ type: 'error', text: 'Please enter a valid URL' })
      return
    }

    if (previewImages.length >= 10) {
      setMessage({ type: 'error', text: 'Maximum 10 preview images allowed' })
      return
    }

    setPreviewImages([...previewImages, newImageUrl.trim()])
    setNewImageUrl('')
    setMessage(null)
  }

  const removeImage = (index: number) => {
    setPreviewImages(previewImages.filter((_, i) => i !== index))
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...previewImages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newImages.length) return
    
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]]
    setPreviewImages(newImages)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addImageUrl()
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Preview Images</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage preview images that users will see when selecting this theme
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              disabled={previewImages.length === 0}
              className="btn-secondary flex items-center space-x-2"
            >
              <EyeIcon className="h-4 w-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={savePreviewImages}
              disabled={isSaving}
              className="btn-primary flex items-center space-x-2"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <PhotoIcon className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Add new image URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Preview Image URL
          </label>
          <div className="flex space-x-3">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={addImageUrl}
              disabled={!newImageUrl.trim() || previewImages.length >= 10}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {previewImages.length}/10 images • Enter a direct URL to an image
          </p>
        </div>

        {/* Preview images list */}
        {previewImages.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Current Preview Images</h4>
            <div className="space-y-3">
              {previewImages.map((imageUrl, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                  {/* Image preview */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/api/placeholder/64/64?text=Error'
                      }}
                    />
                  </div>

                  {/* URL */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate" title={imageUrl}>
                      {imageUrl}
                    </p>
                    <p className="text-xs text-gray-500">Position {index + 1}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === previewImages.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeImage(index)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Remove image"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No preview images added yet</p>
            <p className="text-sm">Add image URLs above to create a preview gallery</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <ThemePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        theme={mockTheme}
        showSelectButton={false}
      />
    </div>
  )
}
