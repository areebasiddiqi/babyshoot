'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
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
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { FormData as ChildFormData, UploadedFile, Theme, Child } from '@/types'
import { validateImageFile, generateBasePrompt } from '@/lib/utils'

const steps = [
  { id: 1, name: 'Child Profile', description: 'Tell us about your little one' },
  { id: 2, name: 'Upload Photos', description: 'Share 5-10 clear photos' },
  { id: 3, name: 'Choose Theme', description: 'Pick a magical theme' },
  { id: 4, name: 'Review & Create', description: 'Start the magic!' }
]

// Themes will be loaded from API

function CreatePhotoshootContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const childId = searchParams.get('child')

  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingChildren, setExistingChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [isLoadingThemes, setIsLoadingThemes] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ChildFormData>()

  // Load existing children and themes on mount
  useEffect(() => {
    if (user) {
      fetchExistingChildren()
      fetchThemes()
    }
  }, [user])

  // Pre-select child if coming from dashboard
  useEffect(() => {
    if (childId && existingChildren.length > 0) {
      const child = existingChildren.find(c => c.id === childId)
      if (child) {
        setSelectedChild(child)
        // Pre-fill form with child data
        setValue('childName', child.name)
        setValue('ageInMonths', child.ageInMonths)
        setValue('gender', child.gender)
        setValue('hairColor', child.hairColor)
        setValue('hairStyle', child.hairStyle)
        setValue('eyeColor', child.eyeColor)
        setValue('skinTone', child.skinTone)
        setValue('uniqueFeatures', child.uniqueFeatures || '')
      }
    }
  }, [childId, existingChildren, setValue])

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

  const fetchThemes = async () => {
    try {
      setIsLoadingThemes(true)
      const response = await fetch('/api/themes')
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

    setUploadedFiles(prev => [...prev, ...newFiles].slice(0, 10))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 10,
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
    setValue('ageInMonths', child.ageInMonths)
    setValue('gender', child.gender)
    setValue('hairColor', child.hairColor)
    setValue('hairStyle', child.hairStyle)
    setValue('eyeColor', child.eyeColor)
    setValue('skinTone', child.skinTone)
    setValue('uniqueFeatures', child.uniqueFeatures || '')
  }

  const onSubmit = async (data: ChildFormData) => {
    if (currentStep < 4) return

    if (uploadedFiles.length < 3) {
      toast.error('Please upload at least 3 photos')
      return
    }

    if (!selectedTheme) {
      toast.error('Please select a theme')
      return
    }

    setIsSubmitting(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      
      // Add child data
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString())
      })
      
      // Add files
      uploadedFiles.forEach((file, index) => {
        formData.append(`photo_${index}`, file.file)
      })
      
      // Add theme
      formData.append('themeId', selectedTheme.id)
      formData.append('themeName', selectedTheme.name)
      formData.append('themePrompt', selectedTheme.prompt)

      const response = await fetch('/api/photoshoot/create', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to create photoshoot')
      }

      const result = await response.json()
      
      if (result.modelReused) {
        toast.success('Photoshoot created! Using existing model - ready to generate!')
      } else {
        toast.success('Photoshoot created! Training your AI model...')
      }
      
      router.push(`/session/${result.sessionId}`)
      
    } catch (error) {
      console.error('Error creating photoshoot:', error)
      toast.error('Failed to create photoshoot. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
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
        const formData = watch()
        return formData.childName && formData.ageInMonths && formData.gender && 
               formData.hairColor && formData.eyeColor && formData.skinTone
      case 2:
        return uploadedFiles.length >= 3
      case 3:
        return selectedTheme !== null
      default:
        return true
    }
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
          {/* Step 1: Child Profile */}
          {currentStep === 1 && (
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
                              {child.ageInMonths < 12 
                                ? `${child.ageInMonths} months old`
                                : `${Math.floor(child.ageInMonths / 12)} years old`
                              }
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
                    <option value="boy">Boy</option>
                    <option value="girl">Girl</option>
                    <option value="other">Other</option>
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
                    <option value="blonde">Blonde</option>
                    <option value="brown">Brown</option>
                    <option value="black">Black</option>
                    <option value="red">Red</option>
                    <option value="auburn">Auburn</option>
                    <option value="gray">Gray</option>
                    <option value="white">White</option>
                    <option value="bald">Bald/Very little hair</option>
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
                    <option value="straight">Straight</option>
                    <option value="wavy">Wavy</option>
                    <option value="curly">Curly</option>
                    <option value="coily">Coily</option>
                    <option value="short">Short</option>
                    <option value="long">Long</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eye Color *
                  </label>
                  <select {...register('eyeColor', { required: 'Eye color is required' })} className="input-field">
                    <option value="">Select eye color</option>
                    <option value="brown">Brown</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="hazel">Hazel</option>
                    <option value="gray">Gray</option>
                    <option value="amber">Amber</option>
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
                    <option value="very fair">Very Fair</option>
                    <option value="fair">Fair</option>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="olive">Olive</option>
                    <option value="tan">Tan</option>
                    <option value="dark">Dark</option>
                    <option value="deep">Deep</option>
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

          {/* Step 2: Upload Photos */}
          {currentStep === 2 && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Photos</h2>
              <p className="text-gray-600 mb-6">
                Upload 5-10 clear photos of your child from different angles. This helps our AI create better results.
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
                    Uploaded Photos ({uploadedFiles.length}/10)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        <img
                          src={file.preview}
                          alt="Upload preview"
                          className="w-full aspect-square object-cover rounded-lg"
                        />
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

          {/* Step 3: Choose Theme */}
          {currentStep === 3 && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose a Theme</h2>
              <p className="text-gray-600 mb-6">
                Select a magical theme for your photoshoot. Each theme is carefully designed to be safe and beautiful for children.
              </p>

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
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      selectedTheme?.id === theme.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-4 flex items-center justify-center">
                      <SparklesIcon className="h-12 w-12 text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{theme.name}</h3>
                    <p className="text-gray-600 text-sm">{theme.description}</p>
                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTheme?.id === theme.id
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {theme.category}
                      </span>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review & Create */}
          {currentStep === 4 && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Create</h2>
              
              <div className="space-y-6">
                {/* Child Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Child Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
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

            {currentStep < 4 ? (
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
                type="submit"
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
      </div>
    </div>
  )
}

export default function CreatePhotoshootPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    }>
      <CreatePhotoshootContent />
    </Suspense>
  )
}
