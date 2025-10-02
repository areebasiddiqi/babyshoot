'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import {
  SparklesIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { formatRelativeTime } from '@/lib/utils'

interface SessionViewProps {
  session: any
}

export default function SessionView({ session: initialSession }: SessionViewProps) {
  const [session, setSession] = useState(initialSession)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [downloadingImages, setDownloadingImages] = useState<Set<string>>(new Set())
  const [sharingImages, setSharingImages] = useState<Set<string>>(new Set())
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

  useEffect(() => {
    // Poll for updates if session is in progress
    if (session.status === 'training' || session.status === 'generating') {
      console.log(`🔄 Starting polling for session ${session.id} - status: ${session.status}`)
      
      const interval = setInterval(async () => {
        try {
          const endpoint = `/api/photoshoot/${session.id}/auto-update`
          console.log(`⏰ Polling session ${session.id} for status updates`)
          console.log(`🌐 SessionView making request to: ${endpoint}`)
          
          // Use the auto-update endpoint for better status checking
          const response = await fetch(endpoint, {
            method: 'POST'
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log(`📊 Session polling response:`, data)
            
            setSession(data.session)
            
            // Stop polling if completed or failed
            if (data.session.status === 'completed' || data.session.status === 'failed') {
              console.log(`⏹️ Stopping session polling - status: ${data.session.status}`)
              clearInterval(interval)
              setPollingInterval(null)
            }
            
            if (data.updated) {
              console.log(`✅ Session status updated: ${data.session.status}`)
            }
          }
        } catch (error) {
          console.error('❌ Failed to poll session status:', error)
        }
      }, 60000) // Poll every minute (60 seconds)

      setPollingInterval(interval)
    }

    return () => {
      if (pollingInterval) {
        console.log(`🛑 Cleaning up session polling for ${session.id}`)
        clearInterval(pollingInterval)
      }
    }
  }, [session.status, session.id])

  const handleGenerateImages = async () => {
    if (session.status !== 'ready') return

    setIsGenerating(true)
    try {
      const response = await fetch(`/api/photoshoot/${session.id}/generate`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Image generation started!')
        // Refresh session data using auto-update endpoint
        const updatedResponse = await fetch(`/api/photoshoot/${session.id}/auto-update`, {
          method: 'POST'
        })
        if (updatedResponse.ok) {
          const data = await updatedResponse.json()
          setSession(data.session)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start generation')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to start generation')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async (imageUrl: string, filename: string, imageId?: string) => {
    if (imageId) {
      setDownloadingImages(prev => new Set(prev).add(imageId))
    }
    
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Image downloaded!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download image')
    } finally {
      if (imageId) {
        setDownloadingImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(imageId)
          return newSet
        })
      }
    }
  }

  const shareImage = async (imageUrl: string, imageId?: string) => {
    if (imageId) {
      setSharingImages(prev => new Set(prev).add(imageId))
    }
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${session.children?.name || 'AI'}'s AI Photoshoot`,
          text: 'Check out this amazing AI-generated photo!',
          url: imageUrl
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(imageUrl)
        toast.success('Image URL copied to clipboard!')
      }
    } catch (error) {
      console.error('Share error:', error)
      // If native share failed, try clipboard fallback
      try {
        await navigator.clipboard.writeText(imageUrl)
        toast.success('Image URL copied to clipboard!')
      } catch (clipboardError) {
        toast.error('Failed to share or copy URL')
      }
    } finally {
      if (imageId) {
        setSharingImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(imageId)
          return newSet
        })
      }
    }
  }

  const getStatusInfo = () => {
    switch (session.status) {
      case 'pending':
        return {
          icon: <ClockIcon className="h-6 w-6 text-yellow-500" />,
          title: 'Preparing...',
          description: 'Your photoshoot is being prepared.',
          color: 'yellow'
        }
      case 'training':
        return {
          icon: <ClockIcon className="h-6 w-6 text-blue-500 animate-spin" />,
          title: 'Training AI Model',
          description: 'We\'re training a custom AI model with your photos. This usually takes 5-15 minutes.',
          color: 'blue'
        }
      case 'ready':
        return {
          icon: <SparklesIcon className="h-6 w-6 text-green-500" />,
          title: 'Ready to Generate!',
          description: 'Your AI model is trained and ready to create magical photos.',
          color: 'green'
        }
      case 'generating':
        return {
          icon: <ClockIcon className="h-6 w-6 text-purple-500 animate-spin" />,
          title: 'Creating Magic',
          description: 'Generating your beautiful AI photos. This takes about 2-5 minutes.',
          color: 'purple'
        }
      case 'completed':
        return {
          icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
          title: 'Photoshoot Complete!',
          description: 'Your magical photos are ready to download and share.',
          color: 'green'
        }
      case 'failed':
        return {
          icon: <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />,
          title: 'Something went wrong',
          description: 'We encountered an issue. Please try creating a new photoshoot.',
          color: 'red'
        }
      default:
        return {
          icon: <ClockIcon className="h-6 w-6 text-gray-500" />,
          title: 'Processing...',
          description: 'Please wait while we process your request.',
          color: 'gray'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-6 w-6 text-primary-500" />
              <span className="font-semibold text-gray-900">
                {session.children?.name || 'AI'}'s Photoshoot
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="card mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {statusInfo.icon}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{statusInfo.title}</h1>
              <p className="text-gray-600">{statusInfo.description}</p>
            </div>
          </div>

          {/* Model Reuse Indicator - detect by marker in base_prompt */}
          {session.base_prompt?.includes('[MODEL_REUSED]') && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-green-500">♻️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Model Reused
                  </p>
                  <p className="text-xs text-green-600">
                    Using existing AI model for faster processing and cost savings
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {session.child_id ? 'Child' : 'Session Type'}
              </h3>
              {session.child_id ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">{session.children?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">
                    {session.children?.age_in_months ? (
                      session.children.age_in_months < 12 
                        ? `${session.children.age_in_months} months old`
                        : `${Math.floor(session.children.age_in_months / 12)} years old`
                    ) : 'Age not specified'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-900">Family Photoshoot</p>
                  <p className="text-sm text-gray-600">Multiple family members</p>
                </>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Theme</h3>
              <p className="text-lg font-semibold text-gray-900">{session.themes?.name || 'Custom'}</p>
              <p className="text-sm text-gray-600">{session.themes?.description}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
              <p className="text-lg font-semibold text-gray-900">
                {formatRelativeTime(new Date(session.created_at))}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(session.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {session.status === 'ready' && (
            <button
              onClick={handleGenerateImages}
              disabled={isGenerating}
              className="btn-primary w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting Generation...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Generate Images
                </>
              )}
            </button>
          )}

          {/* Progress Indicator */}
          {(session.status === 'training' || session.status === 'generating') && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  {session.status === 'training' ? 'Training AI Model' : 'Generating Images'}
                </span>
                <span>Please wait...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    session.status === 'training' ? 'bg-blue-500' : 'bg-purple-500'
                  } animate-pulse`}
                  style={{ width: '60%' }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Generated Images */}
        {session.generated_images && session.generated_images.length > 0 && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Generated Images</h2>
              <span className="text-sm text-gray-600">
                {session.generated_images.filter((img: any) => img.status === 'completed').length} of {session.generated_images.length} ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {session.generated_images.map((image: any, index: number) => (
                <div key={image.id} className="group relative">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    {image.status === 'completed' && image.image_url ? (
                      <img
                        src={image.thumbnail_url || image.image_url}
                        alt={`Generated photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : image.status === 'generating' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Generating...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Failed</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Actions */}
                  {image.status === 'completed' && image.image_url && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadImage(image.image_url, `${session.children?.name || 'ai'}-photo-${index + 1}.jpg`, image.id)}
                          disabled={downloadingImages.has(image.id)}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download"
                        >
                          {downloadingImages.has(image.id) ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                          ) : (
                            <ArrowDownTrayIcon className="h-5 w-5 text-gray-700" />
                          )}
                        </button>
                        <button
                          onClick={() => shareImage(image.image_url, image.id)}
                          disabled={sharingImages.has(image.id)}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Share"
                        >
                          {sharingImages.has(image.id) ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                          ) : (
                            <ShareIcon className="h-5 w-5 text-gray-700" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Download All Button */}
            {session.status === 'completed' && session.generated_images.some((img: any) => img.status === 'completed') && (
              <div className="mt-6 text-center">
                <button
                  onClick={async () => {
                    setIsDownloadingAll(true)
                    const completedImages = session.generated_images.filter((img: any) => img.status === 'completed')
                    
                    try {
                      // Download images with staggered timing
                      for (let i = 0; i < completedImages.length; i++) {
                        const img = completedImages[i]
                        if (i > 0) {
                          // Wait 500ms between downloads to prevent overwhelming the browser
                          await new Promise(resolve => setTimeout(resolve, 500))
                        }
                        await downloadImage(img.image_url, `${session.children?.name || 'ai'}-photo-${i + 1}.jpg`)
                      }
                      toast.success(`Downloaded ${completedImages.length} images!`)
                    } catch (error) {
                      toast.error('Some downloads may have failed')
                    } finally {
                      setIsDownloadingAll(false)
                    }
                  }}
                  disabled={isDownloadingAll}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingAll ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Download All Images
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        {session.status === 'training' && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-3">While you wait...</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• We're creating a custom AI model just for {session.children?.name || 'your child'}</li>
              <li>• This process usually takes 5-15 minutes</li>
              <li>• You'll get an email notification when it's ready</li>
              <li>• Feel free to close this page and come back later</li>
            </ul>
          </div>
        )}

        {session.status === 'generating' && (
          <div className="card bg-purple-50 border-purple-200">
            <h3 className="text-lg font-medium text-purple-900 mb-3">Creating your photos...</h3>
            <ul className="text-sm text-purple-800 space-y-2">
              <li>• Our AI is painting beautiful photos of {session.children?.name || 'your child'}</li>
              <li>• Each image is unique and personalized</li>
              <li>• This takes about 2-5 minutes</li>
              <li>• Images will appear here as they're completed</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}