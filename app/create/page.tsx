'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useCreditBalance, CreditProvider } from '@/contexts/CreditContext'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  SparklesIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CloudArrowUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { FormData as ChildFormData, UploadedFile, Theme, Child } from '@/types'
import { validateImageFile, generateBasePrompt } from '@/lib/utils'
import { useAppConfig } from '@/hooks/useAppConfig'
import ThemePreviewModal from '@/components/ThemePreviewModal'

const steps = [
  { id: 1, name: 'Session Type', description: 'Choose photoshoot type' },
  { id: 2, name: 'Profile Setup', description: 'Add participant details' },
  { id: 3, name: 'Upload Photos', description: 'Share 5-15 clear photos' },
  { id: 4, name: 'Choose Theme', description: 'Pick a magical theme' },
  { id: 5, name: 'Review & Create', description: 'Start the magic!' }
]

// Themes will be loaded from API

function CreatePhotoshootContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { balance: creditBalance, isLoading: isLoadingCredits } = useCreditBalance()
  const { 
    isChildPhotoshootEnabled, 
    isFamilyPhotoshootEnabled, 
    getDefaultSessionType,
    getSessionTypeDescription,
    getAvailableSessionTypes,
    shouldRequireSessionTypeSelection,
    getHairColors,
    getHairStyles,
    getEyeColors,
    getSkinTones,
    getGenders,
    getRelations,
    loading: configLoading 
  } = useAppConfig()
  
  // Get URL parameters in a more stable way
  const [urlParams, setUrlParams] = useState<{ childId?: string; reuseSessionId?: string }>({})
  const [isParamsLoaded, setIsParamsLoaded] = useState(false)
  
  useEffect(() => {
    // Parse URL parameters on client side to avoid suspense issues
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setUrlParams({
        childId: params.get('child') || undefined,
        reuseSessionId: params.get('reuseSession') || undefined
      })
      setIsParamsLoaded(true)
    }
  }, [])
  
  const { childId, reuseSessionId } = urlParams

  const [currentStep, setCurrentStep] = useState(1)
  const [sessionType, setSessionType] = useState<'child' | 'family' | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingChildren, setExistingChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [isLoadingThemes, setIsLoadingThemes] = useState(false)
  const [isLoadingChildData, setIsLoadingChildData] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  
  // Family session states
  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, name: '', age: '', relation: 'parent', gender: 'male' }
  ])

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ChildFormData>()

  // Load existing children and themes on mount
  useEffect(() => {
    if (user) {
      fetchExistingChildren()
      fetchThemes()
    }
  }, [user])

  // Check credit balance and redirect if insufficient
  useEffect(() => {
    if (!isLoadingCredits && creditBalance === 0 && !childId && !reuseSessionId) {
      // Only redirect if not reusing existing session/child (which might be free)
      // And only after credits have finished loading
      toast.error('You need credits to create new photoshoots')
      router.push('/billing')
    }
  }, [isLoadingCredits, creditBalance, childId, reuseSessionId, router])

  // Fetch themes when session type changes
  useEffect(() => {
    if (sessionType) {
      // Reset selected theme when session type changes
      setSelectedTheme(null)
    }
  }, [sessionType])

  // Initialize session type based on app config and URL params
  useEffect(() => {
    if (isParamsLoaded && !configLoading) {
      if (childId && !sessionType) {
        // Pre-select child if coming from dashboard with child ID
        setSessionType('child')
        setCurrentStep(2) // Skip session type selection
      } else if (!sessionType && !shouldRequireSessionTypeSelection()) {
        // Auto-select default session type if not required to choose
        const availableTypes = getAvailableSessionTypes()
        if (availableTypes.length === 1) {
          // Only one option available, auto-select it
          setSessionType(availableTypes[0])
          setCurrentStep(2)
        } else if (availableTypes.length > 1) {
          // Multiple options, use default
          setSessionType(getDefaultSessionType())
        }
      }
    }
  }, [isParamsLoaded, configLoading, childId, sessionType, shouldRequireSessionTypeSelection, getAvailableSessionTypes, getDefaultSessionType])

  // Handle child reuse scenario
  useEffect(() => {
    if (isParamsLoaded && childId && existingChildren.length > 0) {
      const child = existingChildren.find(c => c.id === childId)
      if (child) {
        setSelectedChild(child)
        setValue('childName', child.name)
        setValue('ageInMonths', child.age_in_months || child.ageInMonths || 0)
        setValue('gender', child.gender)
        setValue('hairColor', child.hair_color || child.hairColor || '')
        setValue('hairStyle', child.hair_style || child.hairStyle || '')
        setValue('eyeColor', child.eye_color || child.eyeColor || '')
        setValue('skinTone', child.skin_tone || child.skinTone || '')
        setValue('uniqueFeatures', child.unique_features || child.uniqueFeatures || '')
        
        // Fetch the most recent completed session for this child to get photos
        fetchChildSessionPhotos(childId).finally(() => {
          setIsLoadingChildData(false)
        })
        
        // Skip to theme selection since we have the model
        setCurrentStep(4)
      }
    }
  }, [isParamsLoaded, childId, existingChildren, setValue])

  const fetchChildSessionPhotos = async (childId: string) => {
    try {
      const response = await fetch(`/api/children/${childId}/latest-session`)
      if (response.ok) {
        const sessionData = await response.json()
        
        // Set uploaded photos from the latest session
        if (sessionData.uploaded_photos && sessionData.uploaded_photos.length > 0) {
          const existingPhotos = sessionData.uploaded_photos.map((url: string, index: number) => ({
            id: `existing-${index}`,
            file: null,
            preview: url,
            isExisting: true
          }))
          setUploadedFiles(existingPhotos)
        }
      }
    } catch (error) {
      console.error('Failed to fetch child session photos:', error)
      // Don't show error to user, just proceed without photos
    }
  }

  // Handle reuse session parameter
  useEffect(() => {
    if (isParamsLoaded && reuseSessionId) {
      setIsLoadingChildData(true)
      fetchReuseSessionData(reuseSessionId).finally(() => {
        setIsLoadingChildData(false)
      })
    }
  }, [isParamsLoaded, reuseSessionId])

  const fetchReuseSessionData = async (sessionId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/photoshoot/${sessionId}`)
      if (response.ok) {
        const sessionData = await response.json()
        
        if (sessionData.child_id) {
          // Child session reuse
          setSessionType('child')
          const child = existingChildren.find(c => c.id === sessionData.child_id)
          if (child) {
            setSelectedChild(child)
            setValue('childName', child.name)
            setValue('ageInMonths', child.age_in_months || child.ageInMonths || 0)
            setValue('gender', child.gender)
            setValue('hairColor', child.hair_color || child.hairColor || '')
            setValue('hairStyle', child.hair_style || child.hairStyle || '')
            setValue('eyeColor', child.eye_color || child.eyeColor || '')
            setValue('skinTone', child.skin_tone || child.skinTone || '')
            setValue('uniqueFeatures', child.unique_features || child.uniqueFeatures || '')
          }
        } else if (sessionData.family_fingerprint) {
          // Family session reuse - we'll need to parse the fingerprint back to family members
          setSessionType('family')
          // For now, just set the session type and let user re-enter family members
          // In a future enhancement, we could store family member data separately
        }
        
        // Set uploaded photos from the session
        if (sessionData.uploaded_photos && sessionData.uploaded_photos.length > 0) {
          const existingPhotos = sessionData.uploaded_photos.map((url: string, index: number) => ({
            id: `existing-${index}`,
            file: null, // We don't have the original file
            preview: url,
            isExisting: true
          }))
          setUploadedFiles(existingPhotos)
        }
        
        // Skip to theme selection since we have the model and photos
        setCurrentStep(4)
      }
    } catch (error) {
      console.error('Failed to fetch reuse session data:', error)
      toast.error('Failed to load session data')
    }
  }

  const fetchExistingChildren = async () => {
    try {
      const response = await fetch('/api/children')
      if (response.ok) {
        const children = await response.json()
        setExistingChildren(children)
      }
    } catch (error) {
      console.error('Failed to fetch children:', error)
    }
  }

  const fetchThemes = async (sessionType: 'child' | 'family' = 'child') => {
    try {
      setIsLoadingThemes(true)
      const response = await fetch(`/api/themes?sessionType=${sessionType}`)
      if (response.ok) {
        const themesData = await response.json()
        setThemes(themesData)
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error)
    } finally {
      setIsLoadingThemes(false)
    }
  }

  const handlePreviewTheme = (theme: Theme) => {
    setPreviewTheme(theme)
    setIsPreviewModalOpen(true)
  }

  const handleSelectThemeFromPreview = (theme: Theme) => {
    setSelectedTheme(theme)
    setIsPreviewModalOpen(false)
  }
  const onDrop = (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        toast.error(validation.error!)
        return null
      }
      
      return {
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9)
      }
    }).filter(Boolean) as UploadedFile[]

    setUploadedFiles(prev => [...prev, ...newFiles].slice(0, 15))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 15,
    multiple: true
  })

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const selectExistingChild = (child: Child) => {
    setSelectedChild(child)
    setValue('childName', child.name)
    setValue('ageInMonths', child.ageInMonths || child.age_in_months || 0)
    setValue('gender', child.gender)
    setValue('hairColor', child.hairColor || child.hair_color || '')
    setValue('hairStyle', child.hairStyle || child.hair_style || '')
    setValue('eyeColor', child.eyeColor || child.eye_color || '')
    setValue('skinTone', child.skinTone || child.skin_tone || '')
    setValue('uniqueFeatures', child.uniqueFeatures || child.unique_features || '')
  }

  // Prevent automatic form submission
  const onSubmit = (data: ChildFormData) => {
    // Do nothing - we handle submission manually via handleCreatePhotoshoot
    return
  }

  const handleCreatePhotoshoot = async () => {
    if (uploadedFiles.length < 3) {
      toast.error('Please upload at least 3 photos')
      return
    }

    if (!selectedTheme) {
      toast.error('Please select a theme')
      return
    }

    // Show confirmation before starting training
    const confirmed = window.confirm(
      'Ready to create your photoshoot? This will start training your AI model and may take 5-15 minutes.'
    )
    
    if (!confirmed) {
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Form submission data:', { 
        sessionType, 
        selectedChild, 
        childId, 
        reuseSessionId, 
        uploadedFiles: uploadedFiles.length,
        selectedTheme: selectedTheme?.name 
      })
      
      // Get current form data
      const data = watch()
      
      // Debug child data structure
      if (selectedChild) {
        console.log('Selected child properties:', Object.keys(selectedChild))
        console.log('Age properties:', {
          ageInMonths: selectedChild.ageInMonths,
          age_in_months: selectedChild.age_in_months
        })
      }
      
      // Create FormData for file upload
      const formData = new FormData()
      
      // Add session type
      formData.append('sessionType', sessionType!)
      
      // Add session-specific data
      if (sessionType === 'child') {
        // If we have a selected child (reuse scenario), use that data
        if (selectedChild) {
          formData.append('childName', selectedChild.name)
          formData.append('ageInMonths', (selectedChild.age_in_months || selectedChild.ageInMonths || 0).toString())
          formData.append('gender', selectedChild.gender)
          formData.append('hairColor', selectedChild.hair_color || selectedChild.hairColor || '')
          formData.append('hairStyle', selectedChild.hair_style || selectedChild.hairStyle || '')
          formData.append('eyeColor', selectedChild.eye_color || selectedChild.eyeColor || '')
          formData.append('skinTone', selectedChild.skin_tone || selectedChild.skinTone || '')
          if (selectedChild.unique_features || selectedChild.uniqueFeatures) {
            formData.append('uniqueFeatures', selectedChild.unique_features || selectedChild.uniqueFeatures || '')
          }
        } else {
          // Use form data for new child
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, value.toString())
            }
          })
        }
      } else if (sessionType === 'family') {
        formData.append('familyMembers', JSON.stringify(familyMembers))
      }
      
      // Add files (only new files, not existing ones)
      const newFiles = uploadedFiles.filter(f => !f.isExisting && f.file)
      newFiles.forEach((file, index) => {
        formData.append(`photo_${index}`, file.file!)
      })
      
      // Add existing photo URLs for reuse
      const existingPhotos = uploadedFiles.filter(f => f.isExisting).map(f => f.preview)
      if (existingPhotos.length > 0) {
        formData.append('existingPhotos', JSON.stringify(existingPhotos))
      }
      
      // Add reuse session ID if applicable
      if (reuseSessionId) {
        formData.append('reuseSessionId', reuseSessionId)
      }
      
      // Add child ID for child reuse (when using ?child= parameter)
      if (childId && sessionType === 'child') {
        formData.append('reuseChildId', childId)
      }
      
      // Add theme
      formData.append('themeId', selectedTheme.id)
      formData.append('themeName', selectedTheme.name)
      formData.append('themePrompt', selectedTheme.prompt)

      const response = await fetch('/api/photoshoot/create', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle insufficient credits error
        if (response.status === 402) {
          toast.error(errorData.message || 'Insufficient credits')
          // Redirect to billing page to purchase credits
          setTimeout(() => {
            router.push('/billing')
          }, 2000)
          // Don't reset isSubmitting - user is being redirected to billing
          return
        }
        
        throw new Error(errorData.error || 'Failed to create photoshoot')
      }

      const result = await response.json()
      
      if (result.modelReused) {
        toast.success('Photoshoot created! Using existing model - ready to generate!')
      } else {
        toast.success('Photoshoot created! Training your AI model...')
      }
      
      router.push(`/session/${result.sessionId}`)
      // Don't reset isSubmitting on success - user is being redirected
      return
      
    } catch (error) {
      console.error('Error creating photoshoot:', error)
      toast.error('Failed to create photoshoot. Please try again.')
      setIsSubmitting(false) // Only reset on error
    }
  }

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return sessionType !== null
      case 2:
        if (sessionType === 'child') {
          const formData = watch()
          return formData.childName && formData.ageInMonths && formData.gender && 
                 formData.hairColor && formData.eyeColor && formData.skinTone
        } else if (sessionType === 'family') {
          return familyMembers.every(member => member.name && member.relation && member.gender)
        }
        return false
      case 3:
        return uploadedFiles.length >= 3
      case 4:
        return selectedTheme !== null
      default:
        return true
    }
  }

  // Show loading while URL parameters or credits are being loaded
  if (!isParamsLoaded || isLoadingCredits) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-6 w-6 text-primary-500" />
              <span className="font-semibold text-gray-900">Create Photoshoot</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-primary-500 border-primary-500 text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 ml-6 ${
                    currentStep > step.id ? 'bg-primary-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Session Type Selection */}
          {currentStep === 1 && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Photoshoot Type</h2>
              <p className="text-gray-600 mb-8">Select the type of photoshoot you'd like to create</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Child Photoshoot Option */}
                {isChildPhotoshootEnabled() && (
                  <button
                    type="button"
                    onClick={() => setSessionType('child')}
                    className={`p-6 border-2 rounded-xl transition-all text-left ${
                      sessionType === 'child'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">Child Photoshoot</h3>
                        <p className="text-sm text-gray-600">
                          {getSessionTypeDescription('child') || 'Perfect for individual children'}
                        </p>
                      </div>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Focus on one child</li>
                      <li>• Personalized AI model</li>
                      <li>• Age-appropriate themes</li>
                      <li>• Model reuse for 30 days</li>
                    </ul>
                  </button>
                )}

                {/* Family Photoshoot Option */}
                {isFamilyPhotoshootEnabled() && (
                  <button
                    type="button"
                    onClick={() => setSessionType('family')}
                    className={`p-6 border-2 rounded-xl transition-all text-left ${
                      sessionType === 'family'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                        <PhotoIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">Family Photoshoot</h3>
                        <p className="text-sm text-gray-600">
                          {getSessionTypeDescription('family') || 'Include multiple family members'}
                        </p>
                      </div>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Multiple family members</li>
                      <li>• Group compositions</li>
                      <li>• Family-themed scenarios</li>
                      <li>• Model reuse for same family</li>
                    </ul>
                  </button>
                )}
              </div>

              {/* Show message if no session types are available */}
              {!isChildPhotoshootEnabled() && !isFamilyPhotoshootEnabled() && (
                <div className="text-center py-12">
                  <PhotoIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Session Types Available</h3>
                  <p className="text-gray-600">Please contact support for assistance.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Profile Setup */}
          {currentStep === 2 && sessionType === 'child' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about your little one</h2>
              
              {/* Existing Children */}
              {existingChildren.length > 0 && !selectedChild && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Or choose an existing profile:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {existingChildren.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => selectExistingChild(child)}
                        className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-bold">
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{child.name}</p>
                            <p className="text-sm text-gray-600">
                              {(() => {
                                const ageInMonths = child.ageInMonths || child.age_in_months || 0
                                return ageInMonths < 12 
                                  ? `${ageInMonths} months old`
                                  : `${Math.floor(ageInMonths / 12)} years old`
                              })()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-gray-500">or create a new profile below</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child's Name *
                  </label>
                  <input
                    {...register('childName', { required: 'Name is required' })}
                    className="input-field"
                    placeholder="Enter your child's name"
                  />
                  {errors.childName && (
                    <p className="text-red-500 text-sm mt-1">{errors.childName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age in Months *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    {...register('ageInMonths', { 
                      required: 'Age is required',
                      min: { value: 0, message: 'Age must be positive' },
                      max: { value: 120, message: 'Age must be less than 120 months' }
                    })}
                    className="input-field"
                    placeholder="e.g., 6"
                  />
                  {errors.ageInMonths && (
                    <p className="text-red-500 text-sm mt-1">{errors.ageInMonths.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select {...register('gender', { required: 'Gender is required' })} className="input-field">
                    <option value="">Select gender</option>
                    {getGenders().map((gender) => (
                      <option key={gender} value={gender.toLowerCase()}>
                        {gender}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hair Color *
                  </label>
                  <select {...register('hairColor', { required: 'Hair color is required' })} className="input-field">
                    <option value="">Select hair color</option>
                    {getHairColors().map((color) => (
                      <option key={color} value={color.toLowerCase()}>
                        {color}
                      </option>
                    ))}
                  </select>
                  {errors.hairColor && (
                    <p className="text-red-500 text-sm mt-1">{errors.hairColor.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hair Style
                  </label>
                  <select {...register('hairStyle')} className="input-field">
                    <option value="">Select hair style</option>
                    {getHairStyles().map((style) => (
                      <option key={style} value={style.toLowerCase()}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eye Color *
                  </label>
                  <select {...register('eyeColor', { required: 'Eye color is required' })} className="input-field">
                    <option value="">Select eye color</option>
                    {getEyeColors().map((color) => (
                      <option key={color} value={color.toLowerCase()}>
                        {color}
                      </option>
                    ))}
                  </select>
                  {errors.eyeColor && (
                    <p className="text-red-500 text-sm mt-1">{errors.eyeColor.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skin Tone *
                  </label>
                  <select {...register('skinTone', { required: 'Skin tone is required' })} className="input-field">
                    <option value="">Select skin tone</option>
                    {getSkinTones().map((tone) => (
                      <option key={tone} value={tone.toLowerCase()}>
                        {tone}
                      </option>
                    ))}
                  </select>
                  {errors.skinTone && (
                    <p className="text-red-500 text-sm mt-1">{errors.skinTone.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unique Features (Optional)
                  </label>
                  <textarea
                    {...register('uniqueFeatures')}
                    className="input-field"
                    rows={3}
                    placeholder="e.g., dimples, freckles, birthmarks, etc."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Family Member Setup */}
          {currentStep === 2 && sessionType === 'family' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Family Members</h2>
              <p className="text-gray-600 mb-6">
                Tell us about each family member who will be in the photoshoot.
              </p>

              {familyMembers.map((member, index) => (
                <div key={member.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Family Member {index + 1}
                    </h3>
                    {familyMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFamilyMembers(familyMembers.filter(m => m.id !== member.id))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => {
                          const updated = familyMembers.map(m => 
                            m.id === member.id ? { ...m, name: e.target.value } : m
                          )
                          setFamilyMembers(updated)
                        }}
                        className="input-field"
                        placeholder="Enter name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      <input
                        type="text"
                        value={member.age}
                        onChange={(e) => {
                          const updated = familyMembers.map(m => 
                            m.id === member.id ? { ...m, age: e.target.value } : m
                          )
                          setFamilyMembers(updated)
                        }}
                        className="input-field"
                        placeholder="e.g., 35, 8 years, 6 months"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relation *
                      </label>
                      <select
                        value={member.relation}
                        onChange={(e) => {
                          const updated = familyMembers.map(m => 
                            m.id === member.id ? { ...m, relation: e.target.value } : m
                          )
                          setFamilyMembers(updated)
                        }}
                        className="input-field"
                        required
                      >
                        {getRelations().map((relation) => (
                          <option key={relation} value={relation.toLowerCase()}>
                            {relation}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender *
                      </label>
                      <select
                        value={member.gender}
                        onChange={(e) => {
                          const updated = familyMembers.map(m => 
                            m.id === member.id ? { ...m, gender: e.target.value } : m
                          )
                          setFamilyMembers(updated)
                        }}
                        className="input-field"
                        required
                      >
                        {getGenders().map((gender) => (
                          <option key={gender} value={gender.toLowerCase()}>
                            {gender}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const newId = Math.max(...familyMembers.map(m => m.id)) + 1
                  setFamilyMembers([...familyMembers, {
                    id: newId,
                    name: '',
                    age: '',
                    relation: 'child',
                    gender: 'male'
                  }])
                }}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                + Add Another Family Member
              </button>
            </div>
          )}

          {/* Step 3: Upload Photos */}
          {currentStep === 3 && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Photos</h2>
              <p className="text-gray-600 mb-6">
                Upload 5-15 clear photos {sessionType === 'child' ? 'of your child' : 'of your family members'} from different angles. This helps our AI create better results.
              </p>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary-400 bg-primary-50' 
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive ? 'Drop photos here' : 'Drag & drop photos here'}
                </p>
                <p className="text-gray-600 mb-4">or click to browse</p>
                <p className="text-sm text-gray-500">
                  Supports JPEG, PNG, WebP up to 10MB each
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Photos ({uploadedFiles.length}/15)
                    {uploadedFiles.some(f => f.isExisting) && (
                      <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Reusing existing photos
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        <img
                          src={file.preview}
                          alt="Upload preview"
                          className={`w-full aspect-square object-cover rounded-lg ${
                            file.isExisting 
                              ? 'border-2 border-green-300 bg-green-50' 
                              : ''
                          }`}
                        />
                        {file.isExisting && (
                          <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                            Existing
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadedFiles.length < 3 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Please upload at least 3 photos for best results. More photos = better AI training!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Choose Theme */}
          {currentStep === 4 && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose a Theme</h2>
              <p className="text-gray-600 mb-6">
                {sessionType === 'child' 
                  ? 'Select a magical theme for your photoshoot. Each theme is carefully designed to be safe and beautiful for children.'
                  : 'Select a theme for your family photoshoot. Each theme is designed to create beautiful memories for the whole family.'
                }
              </p>

              {isLoadingChildData ? (
                // Loading child data and photos
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-600 text-lg font-medium">Loading profile and photos...</p>
                  <p className="text-gray-500 text-sm mt-2">This will just take a moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isLoadingThemes ? (
                  // Loading skeleton
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="p-6 border-2 border-gray-200 rounded-xl animate-pulse">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))
                ) : (
                  themes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`relative p-6 border-2 rounded-xl transition-all ${
                      selectedTheme?.id === theme.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => handlePreviewTheme(theme)}
                      className="absolute top-4 right-4 w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-sm transition-all z-10"
                      title="Preview theme"
                    >
                      <EyeIcon className="h-4 w-4 text-gray-600" />
                    </button>

                    {/* Main Theme Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className="w-full text-left"
                    >
                      <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                        {theme.previewImages && theme.previewImages.length > 0 ? (
                          <img 
                            src={theme.previewImages[0]} 
                            alt={`${theme.name} preview`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`${theme.previewImages && theme.previewImages.length > 0 ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                          <SparklesIcon className="h-12 w-12 text-primary-400" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{theme.name}</h3>
                      <p className="text-gray-600 text-sm">{theme.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          selectedTheme?.id === theme.id
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {theme.category}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Preview
                        </span>
                      </div>
                    </button>
                  </div>
                  ))
                )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Create */}
          {currentStep === 5 && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Create</h2>
              
              <div className="space-y-6">
                {/* Session Type */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Session Type</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="capitalize font-medium">{sessionType} Photoshoot</p>
                  </div>
                </div>

                {/* Participants Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {sessionType === 'child' ? 'Child Information' : 'Family Members'}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    {sessionType === 'child' ? (
                      <div>
                        <p><strong>Name:</strong> {watch('childName')}</p>
                        <p><strong>Age:</strong> {watch('ageInMonths')} months</p>
                        <p><strong>Gender:</strong> {watch('gender')}</p>
                        <p><strong>Hair:</strong> {watch('hairStyle')} {watch('hairColor')}</p>
                        <p><strong>Eyes:</strong> {watch('eyeColor')}</p>
                        <p><strong>Skin tone:</strong> {watch('skinTone')}</p>
                        {watch('uniqueFeatures') && (
                          <p><strong>Features:</strong> {watch('uniqueFeatures')}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {familyMembers.map((member, index) => (
                          <div key={member.id} className="border-l-4 border-primary-500 pl-4">
                            <p><strong>{member.name}</strong> - {member.relation}</p>
                            <p className="text-sm text-gray-600">
                              {member.age && `${member.age}, `}{member.gender}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Uploaded Photos ({uploadedFiles.length})
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {uploadedFiles.map((file) => (
                      <img
                        key={file.id}
                        src={file.preview}
                        alt="Upload preview"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Theme</h3>
                  {selectedTheme && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p><strong>{selectedTheme.name}</strong></p>
                      <p className="text-gray-600">{selectedTheme.description}</p>
                    </div>
                  )}
                </div>

                {/* Preview Prompt */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">AI Prompt Preview</h3>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <p className="text-sm text-primary-800">
                      {selectedTheme && generateBasePrompt({
                        name: watch('childName') || '',
                        ageInMonths: watch('ageInMonths') || 0,
                        gender: watch('gender') || '',
                        hairColor: watch('hairColor') || '',
                        hairStyle: watch('hairStyle') || '',
                        eyeColor: watch('eyeColor') || '',
                        skinTone: watch('skinTone') || '',
                        uniqueFeatures: watch('uniqueFeatures')
                      })}
                    </p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Before we start:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Training your AI model will take 5-15 minutes</li>
                    <li>• You'll receive an email when it's ready</li>
                    <li>• Your photos are processed securely and deleted after generation</li>
                    <li>• Generated images will be available for 30 days</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Previous</span>
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  canProceed()
                    ? 'btn-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>Next</span>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreatePhotoshoot}
                disabled={isSubmitting || !canProceed()}
                className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all ${
                  canProceed() && !isSubmitting
                    ? 'btn-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    <span>Create Photoshoot</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Theme Preview Modal */}
        <ThemePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          theme={previewTheme}
          onSelectTheme={handleSelectThemeFromPreview}
          showSelectButton={true}
        />
      </div>
    </div>
  )
}

export default function CreatePhotoshootPage() {
  return (
    <CreditProvider>
      <CreatePhotoshootContent />
    </CreditProvider>
  )
}
