'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { Theme } from '@/types'

interface ThemePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  theme: Theme | null
  onSelectTheme?: (theme: Theme) => void
  showSelectButton?: boolean
}

export default function ThemePreviewModal({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  showSelectButton = false
}: ThemePreviewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!theme) return null

  // Default preview images if none provided (placeholder images)
  const previewImages = theme.previewImages && theme.previewImages.length > 0 
    ? theme.previewImages 
    : [
        '/api/placeholder/400/600?text=Preview+1',
        '/api/placeholder/400/600?text=Preview+2', 
        '/api/placeholder/400/600?text=Preview+3',
        '/api/placeholder/400/600?text=Preview+4',
        '/api/placeholder/400/600?text=Preview+5'
      ]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % previewImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length)
  }

  const handleSelectTheme = () => {
    if (onSelectTheme && theme) {
      onSelectTheme(theme)
      onClose()
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all w-full max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
                      <SparklesIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                        {theme.name}
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">{theme.category}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex flex-col lg:flex-row">
                  {/* Image Gallery */}
                  <div className="flex-1 relative bg-gray-100">
                    <div className="aspect-[3/4] relative">
                      <img
                        src={previewImages[currentImageIndex]}
                        alt={`${theme.name} preview ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement
                          target.src = `/api/placeholder/400/600?text=${encodeURIComponent(theme.name)}+Preview`
                        }}
                      />
                      
                      {/* Navigation arrows */}
                      {previewImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all"
                          >
                            <ChevronLeftIcon className="h-6 w-6" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all"
                          >
                            <ChevronRightIcon className="h-6 w-6" />
                          </button>
                        </>
                      )}

                      {/* Image counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {previewImages.length}
                      </div>
                    </div>

                    {/* Thumbnail strip */}
                    {previewImages.length > 1 && (
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex space-x-2 overflow-x-auto">
                          {previewImages.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentImageIndex
                                  ? 'border-primary-500 ring-2 ring-primary-200'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img
                                src={image}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = `/api/placeholder/64/80?text=${index + 1}`
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details Panel */}
                  <div className="w-full lg:w-80 p-6 bg-gray-50">
                    <div className="space-y-6">
                      {/* Description */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{theme.description}</p>
                      </div>

                      {/* Category */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Category</h4>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                          {theme.category}
                        </span>
                      </div>

                      {/* Sample Prompts */}
                      {theme.prompts && theme.prompts.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Sample Styles</h4>
                          <div className="space-y-2">
                            {theme.prompts.slice(0, 3).map((prompt, index) => (
                              <div key={prompt.id} className="text-xs text-gray-600 bg-white p-2 rounded border">
                                {prompt.prompt_text.length > 100 
                                  ? `${prompt.prompt_text.substring(0, 100)}...`
                                  : prompt.prompt_text
                                }
                              </div>
                            ))}
                            {theme.prompts.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{theme.prompts.length - 3} more variations
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Select Button */}
                      {showSelectButton && (
                        <button
                          onClick={handleSelectTheme}
                          className="w-full btn-primary flex items-center justify-center space-x-2"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          <span>Select This Theme</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
