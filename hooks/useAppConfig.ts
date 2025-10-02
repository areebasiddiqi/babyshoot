import { useState, useEffect } from 'react'

interface PhotoshootOptions {
  child_photoshoot_enabled: boolean
  family_photoshoot_enabled: boolean
  default_session_type: 'child' | 'family'
  require_session_type_selection: boolean
}

interface ProfileFormConfig {
  child_profile_fields: {
    [key: string]: {
      required: boolean
      enabled: boolean
    }
  }
  family_profile_fields: {
    [key: string]: {
      required: boolean
      enabled: boolean
    }
  }
}

interface UICustomization {
  show_session_type_icons: boolean
  session_type_descriptions: {
    child: string
    family: string
  }
  default_theme_categories: string[]
}

interface ProfileFieldOptions {
  hair_colors: string[]
  hair_styles: string[]
  eye_colors: string[]
  skin_tones: string[]
  genders: string[]
  relations: string[]
}

interface AppConfig {
  photoshoot_options: PhotoshootOptions
  profile_form_config: ProfileFormConfig
  profile_field_options: ProfileFieldOptions
  ui_customization: UICustomization
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/app-config')
      
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setError(null)
      } else {
        setError('Failed to load configuration')
      }
    } catch (err) {
      console.error('Error fetching app config:', err)
      setError('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const refreshConfig = () => {
    fetchConfig()
  }

  // Helper functions for common config checks
  const isChildPhotoshootEnabled = () => {
    return config?.photoshoot_options?.child_photoshoot_enabled ?? true
  }

  const isFamilyPhotoshootEnabled = () => {
    return config?.photoshoot_options?.family_photoshoot_enabled ?? true
  }

  const getAvailableSessionTypes = () => {
    const types: Array<'child' | 'family'> = []
    if (isChildPhotoshootEnabled()) types.push('child')
    if (isFamilyPhotoshootEnabled()) types.push('family')
    return types
  }

  const getDefaultSessionType = () => {
    const defaultType = config?.photoshoot_options?.default_session_type ?? 'child'
    const availableTypes = getAvailableSessionTypes()
    
    // If default type is not available, return the first available type
    if (availableTypes.includes(defaultType)) {
      return defaultType
    }
    return availableTypes[0] || 'child'
  }

  const shouldRequireSessionTypeSelection = () => {
    return config?.photoshoot_options?.require_session_type_selection ?? true
  }

  const getSessionTypeDescription = (type: 'child' | 'family') => {
    return config?.ui_customization?.session_type_descriptions?.[type] || ''
  }

  const isProfileFieldEnabled = (sessionType: 'child' | 'family', fieldName: string) => {
    const fieldConfig = sessionType === 'child' 
      ? config?.profile_form_config?.child_profile_fields?.[fieldName]
      : config?.profile_form_config?.family_profile_fields?.[fieldName]
    
    return fieldConfig?.enabled ?? true
  }

  const isProfileFieldRequired = (sessionType: 'child' | 'family', fieldName: string) => {
    const fieldConfig = sessionType === 'child'
      ? config?.profile_form_config?.child_profile_fields?.[fieldName]
      : config?.profile_form_config?.family_profile_fields?.[fieldName]
    
    return fieldConfig?.required ?? false
  }

  const getProfileFieldOptions = (fieldName: keyof ProfileFieldOptions) => {
    return config?.profile_field_options?.[fieldName] ?? []
  }

  const getHairColors = () => getProfileFieldOptions('hair_colors')
  const getHairStyles = () => getProfileFieldOptions('hair_styles')
  const getEyeColors = () => getProfileFieldOptions('eye_colors')
  const getSkinTones = () => getProfileFieldOptions('skin_tones')
  const getGenders = () => getProfileFieldOptions('genders')
  const getRelations = () => getProfileFieldOptions('relations')

  return {
    config,
    loading,
    error,
    refreshConfig,
    
    // Helper functions
    isChildPhotoshootEnabled,
    isFamilyPhotoshootEnabled,
    getAvailableSessionTypes,
    getDefaultSessionType,
    shouldRequireSessionTypeSelection,
    getSessionTypeDescription,
    isProfileFieldEnabled,
    isProfileFieldRequired,
    
    // Profile field options
    getProfileFieldOptions,
    getHairColors,
    getHairStyles,
    getEyeColors,
    getSkinTones,
    getGenders,
    getRelations
  }
}
