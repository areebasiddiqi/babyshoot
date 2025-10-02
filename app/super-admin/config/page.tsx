'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CogIcon, 
  UserGroupIcon, 
  PhotoIcon,
  PaintBrushIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface AppConfig {
  id: string
  config_key: string
  config_value: any
  description: string
  category: string
  is_active: boolean
  updated_at: string
}

export default function SuperAdminConfigPage() {
  const [configs, setConfigs] = useState<AppConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{field: string, values: string[]} | null>(null)
  const [editValues, setEditValues] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/super-admin/config')
      if (response.status === 403) {
        toast.error('Super admin access required')
        router.push('/admin')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      } else {
        toast.error('Failed to load configuration')
      }
    } catch (error) {
      console.error('Error fetching configs:', error)
      toast.error('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (configKey: string, newValue: any, description?: string) => {
    setSaving(configKey)
    try {
      const response = await fetch('/api/super-admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_key: configKey,
          config_value: newValue,
          description
        })
      })

      if (response.ok) {
        toast.success('Configuration updated successfully')
        fetchConfigs() // Refresh the list
      } else {
        toast.error('Failed to update configuration')
      }
    } catch (error) {
      toast.error('Failed to update configuration')
    } finally {
      setSaving(null)
    }
  }

  const togglePhotoshootOption = (optionKey: string, currentValue: boolean) => {
    const photoshootConfig = configs.find(c => c.config_key === 'photoshoot_options')
    if (photoshootConfig) {
      const newValue = {
        ...photoshootConfig.config_value,
        [optionKey]: !currentValue
      }
      updateConfig('photoshoot_options', newValue, photoshootConfig.description)
    }
  }

  const updateDefaultSessionType = (sessionType: 'child' | 'family') => {
    const photoshootConfig = configs.find(c => c.config_key === 'photoshoot_options')
    if (photoshootConfig) {
      const newValue = {
        ...photoshootConfig.config_value,
        default_session_type: sessionType
      }
      updateConfig('photoshoot_options', newValue, photoshootConfig.description)
    }
  }

  const editProfileOptions = (field: string, currentValues: string[]) => {
    setEditingField({ field, values: currentValues })
    setEditValues(currentValues.join('\n'))
  }

  const saveProfileOptions = async () => {
    if (!editingField) return

    const newValues = editValues.split('\n').map(v => v.trim()).filter(v => v.length > 0)
    const profileOptionsConfig = configs.find(c => c.config_key === 'profile_field_options')
    
    if (profileOptionsConfig) {
      const newConfig = {
        ...profileOptionsConfig.config_value,
        [editingField.field]: newValues
      }
      
      await updateConfig('profile_field_options', newConfig, profileOptionsConfig.description)
      setEditingField(null)
      setEditValues('')
    }
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValues('')
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'photoshoot': return <PhotoIcon className="h-5 w-5" />
      case 'profile': return <UserGroupIcon className="h-5 w-5" />
      case 'ui': return <PaintBrushIcon className="h-5 w-5" />
      default: return <CogIcon className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  const photoshootConfig = configs.find(c => c.config_key === 'photoshoot_options')?.config_value
  const profileConfig = configs.find(c => c.config_key === 'profile_form_config')?.config_value
  const profileOptions = configs.find(c => c.config_key === 'profile_field_options')?.config_value
  const uiConfig = configs.find(c => c.config_key === 'ui_customization')?.config_value

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Configuration</h1>
            <p className="text-gray-600 mt-2">Manage global application settings</p>
          </div>
          
          <button
            onClick={() => router.push('/admin')}
            className="btn-secondary"
          >
            Back to Admin
          </button>
        </div>

        <div className="space-y-8">
          {/* Photoshoot Options */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <PhotoIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Photoshoot Options</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Available Session Types</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Child Photoshoot</h4>
                      <p className="text-sm text-gray-600">Individual child portrait sessions</p>
                    </div>
                    <button
                      onClick={() => togglePhotoshootOption('child_photoshoot_enabled', photoshootConfig?.child_photoshoot_enabled)}
                      disabled={saving === 'photoshoot_options'}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        photoshootConfig?.child_photoshoot_enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {photoshootConfig?.child_photoshoot_enabled ? (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="h-4 w-4" />
                          Disabled
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Family Photoshoot</h4>
                      <p className="text-sm text-gray-600">Multi-person family portrait sessions</p>
                    </div>
                    <button
                      onClick={() => togglePhotoshootOption('family_photoshoot_enabled', photoshootConfig?.family_photoshoot_enabled)}
                      disabled={saving === 'photoshoot_options'}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        photoshootConfig?.family_photoshoot_enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {photoshootConfig?.family_photoshoot_enabled ? (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="h-4 w-4" />
                          Disabled
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Default Settings</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Session Type
                    </label>
                    <select
                      value={photoshootConfig?.default_session_type || 'child'}
                      onChange={(e) => updateDefaultSessionType(e.target.value as 'child' | 'family')}
                      disabled={saving === 'photoshoot_options'}
                      className="input-field"
                    >
                      <option value="child">Child Photoshoot</option>
                      <option value="family">Family Photoshoot</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Require Session Type Selection</h4>
                      <p className="text-sm text-gray-600">Force users to choose session type</p>
                    </div>
                    <button
                      onClick={() => togglePhotoshootOption('require_session_type_selection', photoshootConfig?.require_session_type_selection)}
                      disabled={saving === 'photoshoot_options'}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        photoshootConfig?.require_session_type_selection
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {photoshootConfig?.require_session_type_selection ? (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          Required
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="h-4 w-4" />
                          Optional
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Field Options */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Profile Field Options</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Hair Colors */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Hair Colors</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {profileOptions?.hair_colors?.map((color: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-white rounded text-sm text-gray-700 border">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => editProfileOptions('hair_colors', profileOptions?.hair_colors)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit Hair Colors
                </button>
              </div>

              {/* Eye Colors */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Eye Colors</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {profileOptions?.eye_colors?.map((color: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-white rounded text-sm text-gray-700 border">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => editProfileOptions('eye_colors', profileOptions?.eye_colors)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit Eye Colors
                </button>
              </div>

              {/* Skin Tones */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Skin Tones</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {profileOptions?.skin_tones?.map((tone: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-white rounded text-sm text-gray-700 border">
                        {tone}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => editProfileOptions('skin_tones', profileOptions?.skin_tones)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit Skin Tones
                </button>
              </div>

              {/* Hair Styles */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Hair Styles</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {profileOptions?.hair_styles?.map((style: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-white rounded text-sm text-gray-700 border">
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => editProfileOptions('hair_styles', profileOptions?.hair_styles)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit Hair Styles
                </button>
              </div>

              {/* Genders */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Gender Options</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {profileOptions?.genders?.map((gender: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-white rounded text-sm text-gray-700 border">
                        {gender}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => editProfileOptions('genders', profileOptions?.genders)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit Gender Options
                </button>
              </div>

              {/* Relations */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Family Relations</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {profileOptions?.relations?.map((relation: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-white rounded text-sm text-gray-700 border">
                        {relation}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => editProfileOptions('relations', profileOptions?.relations)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit Relations
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration Summary</h2>
            
            <div className="space-y-4">
              {configs.map((config) => (
                <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(config.category)}
                      <div>
                        <h3 className="font-medium text-gray-900">{config.config_key}</h3>
                        <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated: {new Date(config.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded border">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(config.config_value, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Options Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit {editingField.field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Enter one option per line. These will appear as dropdown choices in the profile forms.
            </p>
            
            <textarea
              value={editValues}
              onChange={(e) => setEditValues(e.target.value)}
              className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none font-mono text-sm"
              placeholder="Option 1&#10;Option 2&#10;Option 3"
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveProfileOptions}
                disabled={saving === 'profile_field_options'}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
              >
                {saving === 'profile_field_options' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
