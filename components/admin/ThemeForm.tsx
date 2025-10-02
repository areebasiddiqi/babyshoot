'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon } from '@heroicons/react/24/outline'

interface ThemeFormProps {
  theme?: {
    id: string
    name: string
    description: string
    prompt: string
    category: string
    session_type: string
    is_active: boolean
  }
}

const categories = [
  'newborn', 'toddler', 'family', 'seasonal', 'fantasy', 
  'holiday', 'outdoor', 'formal', 'lifestyle', 'sports', 
  'vintage', 'adventure'
]

const sessionTypes = [
  { value: 'child', label: 'Child Only' },
  { value: 'family', label: 'Family Only' },
  { value: 'both', label: 'Both Child & Family' }
]

export default function ThemeForm({ theme }: ThemeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: theme?.name || '',
    description: theme?.description || '',
    prompt: theme?.prompt || '',
    category: theme?.category || 'fantasy',
    session_type: theme?.session_type || 'both',
    is_active: theme?.is_active ?? true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = theme ? `/api/admin/themes/${theme.id}` : '/api/admin/themes'
      const method = theme ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/themes')
        router.refresh()
      } else {
        const error = await response.json()
        console.error('Failed to save theme:', error)
        alert('Failed to save theme. Please try again.')
      }
    } catch (error) {
      console.error('Error saving theme:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Theme Preview */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Theme Preview</h3>
          <div className="flex items-start space-x-4">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-8 w-8 text-primary-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">
                {formData.name || 'Theme Name'}
              </h4>
              <p className="text-gray-600 mb-2">
                {formData.description || 'Theme description will appear here...'}
              </p>
              <div className="flex space-x-2">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {formData.category}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  formData.session_type === 'child' ? 'bg-blue-100 text-blue-800' :
                  formData.session_type === 'family' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {sessionTypes.find(t => t.value === formData.session_type)?.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Theme Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Magical Forest Adventure"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="input-field"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="input-field"
            placeholder="Brief description of the theme that users will see..."
          />
        </div>

        <div>
          <label htmlFor="session_type" className="block text-sm font-medium text-gray-700 mb-2">
            Session Type *
          </label>
          <select
            id="session_type"
            name="session_type"
            required
            value={formData.session_type}
            onChange={handleChange}
            className="input-field"
          >
            {sessionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Choose whether this theme is for child sessions, family sessions, or both.
          </p>
        </div>

        {/* AI Prompt */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            AI Prompt *
          </label>
          <textarea
            id="prompt"
            name="prompt"
            required
            rows={6}
            value={formData.prompt}
            onChange={handleChange}
            className="input-field"
            placeholder="Detailed prompt for AI image generation. Be specific about setting, lighting, mood, and visual elements..."
          />
          <p className="text-sm text-gray-500 mt-1">
            This prompt will be used by the AI to generate images. Be descriptive and specific about the visual style, setting, and mood.
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Make theme active (visible to users)
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : theme ? 'Update Theme' : 'Create Theme'}
          </button>
        </div>
      </form>
    </div>
  )
}
