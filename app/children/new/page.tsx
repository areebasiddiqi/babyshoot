'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { FormData } from '@/types'
import { useCreditBalance, CreditProvider } from '@/contexts/CreditContext'

function NewChildContent() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { balance: creditBalance, isLoading: isLoadingCredits } = useCreditBalance()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  // Check credit balance and redirect if insufficient
  useEffect(() => {
    if (!isLoadingCredits && creditBalance === 0) {
      toast.error('You need credits to create child profiles')
      router.push('/billing')
    }
  }, [isLoadingCredits, creditBalance, router])

  // Show loading while credits are being loaded
  if (isLoadingCredits) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
          return
        }
        
        throw new Error(errorData.error || 'Failed to create child profile')
      }

      const child = await response.json()
      toast.success(`${child.name}'s profile created successfully!`)
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Error creating child:', error)
      toast.error('Failed to create child profile. Please try again.')
    } finally {
      setIsSubmitting(false)
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
              <UserIcon className="h-6 w-6 text-primary-500" />
              <span className="font-semibold text-gray-900">Add Child Profile</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Child Profile</h1>
            <p className="text-gray-600">
              Tell us about your little one to personalize their AI photoshoots
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
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
                <p className="text-sm text-gray-500 mt-1">
                  Describe any special features that make your child unique
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Privacy & Safety</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• This information helps create personalized AI prompts</li>
                <li>• All data is stored securely and never shared</li>
                <li>• You can edit or delete this profile anytime</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4">
              <Link href="/dashboard" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Create Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NewChildPage() {
  return (
    <CreditProvider>
      <NewChildContent />
    </CreditProvider>
  )
}
