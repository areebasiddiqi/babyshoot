'use client'

import React from 'react'
import { usePhotoshootStatus } from '@/hooks/useTrainingStatus'
import Image from 'next/image'
import LoadingSpinner from './LoadingSpinner'

interface PhotoshootStatusTrackerProps {
  sessionId: string
  initialStatus?: string
  onStatusChange?: (status: string) => void
}

export function PhotoshootStatusTracker({ 
  sessionId, 
  initialStatus = 'pending',
  onStatusChange 
}: PhotoshootStatusTrackerProps) {
  const {
    status,
    modelId,
    eta,
    message,
    images,
    isChecking,
    error,
    checkStatus,
    isTraining,
    isReady,
    isGenerating,
    isCompleted,
    isFailed
  } = usePhotoshootStatus(sessionId, initialStatus)

  // Notify parent of status changes
  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status)
    }
  }, [status, onStatusChange])

  const getStatusIcon = () => {
    if (isChecking) return <LoadingSpinner />
    if (isCompleted) return <span className="text-green-500">✅</span>
    if (isFailed) return <span className="text-red-500">❌</span>
    if (isTraining) return <span className="text-blue-500">🔄</span>
    if (isGenerating) return <span className="text-purple-500">✨</span>
    if (isReady) return <span className="text-green-500">🎯</span>
    return <span className="text-gray-500">⏳</span>
  }

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-100 text-green-800'
    if (isFailed) return 'bg-red-100 text-red-800'
    if (isTraining) return 'bg-blue-100 text-blue-800'
    if (isGenerating) return 'bg-purple-100 text-purple-800'
    if (isReady) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusMessage = () => {
    if (message) return message
    
    switch (status) {
      case 'pending':
        return 'Preparing your photoshoot...'
      case 'training':
        return 'Training AI model with your photos...'
      case 'ready':
        return 'Model ready! You can now generate images.'
      case 'generating':
        return 'Generating your beautiful photos...'
      case 'completed':
        return 'Your photoshoot is complete!'
      case 'failed':
        return 'Something went wrong. Please try again.'
      default:
        return 'Processing...'
    }
  }

  const generateImages = async () => {
    try {
      const response = await fetch(`/api/photoshoot/${sessionId}/generate`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Status will be automatically updated by the hook
        console.log('Image generation started')
      } else {
        console.error('Failed to start image generation')
      }
    } catch (error) {
      console.error('Error starting image generation:', error)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md border">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h2 className="text-xl font-semibold">Photoshoot Status</h2>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Status Message */}
        <div className="text-sm text-gray-600">
          {getStatusMessage()}
        </div>

        {/* ETA if available */}
        {eta && (
          <div className="text-xs text-gray-500">
            Estimated completion: {new Date(eta).toLocaleString()}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            Error: {error}
          </div>
        )}

        {/* Model ID */}
        {modelId && (
          <div className="text-xs text-gray-500">
            Model ID: {modelId}
          </div>
        )}

        {/* Generate Images Button */}
        {isReady && (
          <button 
            onClick={generateImages}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isChecking}
          >
            {isChecking ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2">Starting Generation...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">✨</span>
                Generate Images
              </span>
            )}
          </button>
        )}

        {/* Generated Images */}
        {images && images.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Generated Images ({images.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {images.map((image, index) => (
                <div key={image.id} className="relative aspect-square">
                  {image.image_url ? (
                    <Image
                      src={image.image_url}
                      alt={`Generated image ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                  <span 
                    className={`absolute top-1 right-1 text-xs px-1 py-0.5 rounded ${
                      image.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {image.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Refresh Button */}
        <button 
          onClick={checkStatus}
          disabled={isChecking}
          className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? (
            <span className="flex items-center justify-center">
              <LoadingSpinner />
              <span className="ml-2">Checking Status...</span>
            </span>
          ) : (
            'Refresh Status'
          )}
        </button>

        {/* Progress Indicator */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500 w-full' :
              isGenerating ? 'bg-purple-500 w-3/4' :
              isReady ? 'bg-green-500 w-2/3' :
              isTraining ? 'bg-blue-500 w-1/3' :
              'bg-gray-400 w-1/6'
            }`}
          />
        </div>
      </div>
    </div>
  )
}
