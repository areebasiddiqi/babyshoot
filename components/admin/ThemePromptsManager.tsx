'use client'

import { useState, useEffect } from 'react'
import { 
  TrashIcon, 
  PlusIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

interface ThemePrompt {
  id: string
  prompt_text: string
  prompt_order: number
  is_active: boolean
  created_at: string
}

interface Theme {
  id: string
  name: string
  image_count: number
}

interface ThemePromptsManagerProps {
  theme: Theme
  onClose: () => void
}

export default function ThemePromptsManager({ theme, onClose }: ThemePromptsManagerProps) {
  const [prompts, setPrompts] = useState<ThemePrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newPromptText, setNewPromptText] = useState('')
  const [imageCount, setImageCount] = useState(theme.image_count)
  const [savingImageCount, setSavingImageCount] = useState(false)

  useEffect(() => {
    fetchPrompts()
  }, [theme.id])

  const fetchPrompts = async () => {
    try {
      const response = await fetch(`/api/admin/themes/${theme.id}/prompts`)
      if (response.ok) {
        const data = await response.json()
        setPrompts(data)
      } else {
        alert('Failed to fetch prompts')
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
      alert('Failed to fetch prompts')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPrompt = async () => {
    if (!newPromptText.trim()) {
      alert('Please enter prompt text')
      return
    }

    try {
      const response = await fetch(`/api/admin/themes/${theme.id}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_text: newPromptText.trim() })
      })

      if (response.ok) {
        const result = await response.json()
        setPrompts([...prompts, result.prompt])
        setNewPromptText('')
        alert('Prompt added successfully')
      } else {
        alert('Failed to add prompt')
      }
    } catch (error) {
      console.error('Error adding prompt:', error)
      alert('Failed to add prompt')
    }
  }

  const handleUpdatePrompt = async (promptId: string) => {
    if (!editText.trim()) {
      alert('Please enter prompt text')
      return
    }

    try {
      const response = await fetch(`/api/admin/themes/${theme.id}/prompts/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_text: editText.trim() })
      })

      if (response.ok) {
        const result = await response.json()
        setPrompts(prompts.map(p => p.id === promptId ? result.prompt : p))
        setEditingPrompt(null)
        setEditText('')
        alert('Prompt updated successfully')
      } else {
        alert('Failed to update prompt')
      }
    } catch (error) {
      console.error('Error updating prompt:', error)
      alert('Failed to update prompt')
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const response = await fetch(`/api/admin/themes/${theme.id}/prompts/${promptId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPrompts(prompts.filter(p => p.id !== promptId))
        alert('Prompt deleted successfully')
      } else {
        alert('Failed to delete prompt')
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
      alert('Failed to delete prompt')
    }
  }

  const handleToggleActive = async (promptId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/themes/${theme.id}/prompts/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt_text: prompts.find(p => p.id === promptId)?.prompt_text,
          is_active: !isActive 
        })
      })

      if (response.ok) {
        const result = await response.json()
        setPrompts(prompts.map(p => p.id === promptId ? result.prompt : p))
        alert(`Prompt ${!isActive ? 'activated' : 'deactivated'}`)
      } else {
        alert('Failed to update prompt status')
      }
    } catch (error) {
      console.error('Error updating prompt status:', error)
      alert('Failed to update prompt status')
    }
  }

  const handleUpdateImageCount = async () => {
    if (imageCount < 1 || imageCount > 20) {
      alert('Image count must be between 1 and 20')
      return
    }

    setSavingImageCount(true)
    try {
      const response = await fetch(`/api/admin/themes/${theme.id}/prompts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_count: imageCount })
      })

      if (response.ok) {
        alert('Image count updated successfully')
      } else {
        alert('Failed to update image count')
      }
    } catch (error) {
      console.error('Error updating image count:', error)
      alert('Failed to update image count')
    } finally {
      setSavingImageCount(false)
    }
  }

  const startEditing = (prompt: ThemePrompt) => {
    setEditingPrompt(prompt.id)
    setEditText(prompt.prompt_text)
  }

  const cancelEditing = () => {
    setEditingPrompt(null)
    setEditText('')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="card w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold">Loading prompts...</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Manage Prompts: {theme.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure individual prompts for each image variation
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Image Count Configuration */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-2">Image Count Configuration</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="20"
                value={imageCount}
                onChange={(e) => setImageCount(parseInt(e.target.value) || 1)}
                className="input-field w-20"
              />
              <span className="text-sm text-gray-600">images per session</span>
              <button 
                onClick={handleUpdateImageCount}
                disabled={savingImageCount}
                className="btn-primary text-sm px-3 py-1"
              >
                {savingImageCount ? 'Saving...' : 'Update'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This determines how many images will be generated for this theme
            </p>
          </div>

          {/* Add New Prompt */}
          <div className="mb-6 p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Add New Prompt</h3>
            <div className="flex gap-2">
              <textarea
                placeholder="Enter prompt text (e.g., 'sitting on a colorful playground, bright sunny day, joyful expression')"
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                className="input-field flex-1"
                rows={2}
              />
              <button 
                onClick={handleAddPrompt} 
                disabled={!newPromptText.trim()}
                className="btn-primary flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {/* Existing Prompts */}
          <div className="space-y-3">
            <h3 className="font-medium">Existing Prompts ({prompts.length})</h3>
            
            {prompts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No prompts found. Add some prompts to get started.
              </p>
            ) : (
              prompts
                .sort((a, b) => a.prompt_order - b.prompt_order)
                .map((prompt, index) => (
                  <div key={prompt.id} className="card p-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex items-center gap-2 mt-1">
                        <Bars3Icon className="h-4 w-4 text-gray-400" />
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          #{prompt.prompt_order}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {editingPrompt === prompt.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="input-field w-full"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdatePrompt(prompt.id)}
                                disabled={!editText.trim()}
                                className="btn-primary text-sm px-3 py-1 flex items-center gap-1"
                              >
                                <CheckIcon className="h-3 w-3" />
                                Save
                              </button>
                              <button 
                                onClick={cancelEditing}
                                className="btn-secondary text-sm px-3 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{prompt.prompt_text}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span 
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                                  prompt.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                                onClick={() => handleToggleActive(prompt.id, prompt.is_active)}
                              >
                                {prompt.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Created: {new Date(prompt.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEditing(prompt)}
                          disabled={editingPrompt === prompt.id}
                          className="text-blue-600 hover:text-blue-900 p-1 disabled:opacity-50"
                          title="Edit Prompt"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(prompt.id)}
                          disabled={editingPrompt === prompt.id}
                          className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                          title="Delete Prompt"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {prompts.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Each prompt will generate one unique image</li>
                <li>• Prompts are used in order (1, 2, 3, etc.)</li>
                <li>• Only the first {imageCount} active prompts will be used</li>
                <li>• Each image combines the base theme prompt with the specific prompt text</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
