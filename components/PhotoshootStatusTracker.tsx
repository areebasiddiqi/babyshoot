'use client'

import React from 'react'
import { usePhotoshootStatus } from '@/hooks/useTrainingStatus'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, Clock, Wand2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

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
    if (isChecking) return <Loader2 className="h-4 w-4 animate-spin" />
    if (isCompleted) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (isFailed) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (isTraining) return <Clock className="h-4 w-4 text-blue-500" />
    if (isGenerating) return <Wand2 className="h-4 w-4 text-purple-500" />
    if (isReady) return <ImageIcon className="h-4 w-4 text-green-500" />
    return <Clock className="h-4 w-4 text-gray-500" />
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Photoshoot Status
          <Badge className={getStatusColor()}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
          <Button 
            onClick={generateImages}
            className="w-full"
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Starting Generation...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Images
              </>
            )}
          </Button>
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
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  )}
                  <Badge 
                    className="absolute top-1 right-1 text-xs"
                    variant={image.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {image.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Refresh Button */}
        <Button 
          variant="outline" 
          onClick={checkStatus}
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Checking Status...
            </>
          ) : (
            'Refresh Status'
          )}
        </Button>

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
      </CardContent>
    </Card>
  )
}
