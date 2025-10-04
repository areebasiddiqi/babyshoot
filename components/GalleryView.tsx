'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  PhotoIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { formatRelativeTime } from '@/lib/utils'
import ConfirmDialog from '@/components/ConfirmDialog'

interface GalleryViewProps {
  sessions: any[]
}

export default function GalleryView({ sessions: initialSessions }: GalleryViewProps) {
  const [sessions, setSessions] = useState(initialSessions)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    sessionId: string
    sessionName: string
  }>({ isOpen: false, sessionId: '', sessionName: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'training':
      case 'generating':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'training': return 'Training'
      case 'ready': return 'Ready'
      case 'generating': return 'Generating'
      case 'completed': return 'Completed'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/photoshoot/${sessionId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove the session from local state
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        setDeleteDialog({ isOpen: false, sessionId: '', sessionName: '' })
      } else {
        const error = await response.json()
        alert(`Failed to delete photoshoot: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete session error:', error)
      alert('Failed to delete photoshoot. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (sessionId: string, sessionName: string) => {
    setDeleteDialog({ isOpen: true, sessionId, sessionName })
  }

  const handleConfirmDelete = () => {
    handleDeleteSession(deleteDialog.sessionId)
  }

  const filteredSessions = sessions
    .filter(session => {
      const sessionName = session.child_id ? session.children?.name || '' : 'Family'
      const themeName = session.themes?.name || ''
      const matchesSearch = sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           themeName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name':
          const aName = a.child_id ? a.children?.name || '' : 'Family'
          const bName = b.child_id ? b.children?.name || '' : 'Family'
          return aName.localeCompare(bName)
        default:
          return 0
      }
    })

  const completedSessions = sessions.filter(s => s.status === 'completed')
  const totalImages = completedSessions.reduce((acc, session) => 
    acc + (session.generated_images?.filter((img: any) => img.status === 'completed').length || 0), 0
  )

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <PhotoIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Photoshoots</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedSessions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-secondary-100 rounded-lg">
              <PhotoIcon className="h-6 w-6 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Generated Images</p>
              <p className="text-2xl font-bold text-gray-900">{totalImages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by child name, family, or theme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="training">Training</option>
              <option value="generating">Generating</option>
              <option value="ready">Ready</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field min-w-[120px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">By Name</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredSessions.length === 0 ? (
        <div className="card text-center py-12">
          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {sessions.length === 0 ? 'No photoshoots yet' : 'No matching photoshoots'}
          </h3>
          <p className="text-gray-600 mb-6">
            {sessions.length === 0 
              ? 'Create your first AI-powered baby photoshoot to get started.'
              : 'Try adjusting your search or filters.'
            }
          </p>
          {sessions.length === 0 && (
            <Link href="/create" className="btn-primary">
              Create Photoshoot
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div 
              key={session.id} 
              className="card hover:shadow-xl transition-all duration-200 group relative"
            >
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openDeleteDialog(
                    session.id, 
                    session.child_id ? session.children?.name || 'Child Session' : 'Family Session'
                  )
                }}
                className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Delete photoshoot"
              >
                <TrashIcon className="h-4 w-4 text-gray-600 hover:text-red-500 transition-colors" />
              </button>

              {/* Clickable Link Area */}
              <Link href={`/session/${session.id}`} className="block">
                {/* Image Preview */}
                <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl mb-4 overflow-hidden">
                  {session.generated_images && session.generated_images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {session.generated_images
                        .filter((img: any) => img.status === 'completed')
                        .slice(0, 4)
                        .map((image: any, index: number) => (
                          <img
                            key={image.id}
                            src={image.thumbnail_url || image.image_url}
                            alt={`Generated photo ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ))}
                      {session.generated_images.filter((img: any) => img.status === 'completed').length === 0 && (
                        <div className="col-span-2 flex items-center justify-center h-full">
                          <PhotoIcon className="h-12 w-12 text-primary-400" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PhotoIcon className="h-12 w-12 text-primary-400" />
                    </div>
                  )}
                </div>
                
                {/* Session Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {session.child_id ? `${session.children?.name}'s Photoshoot` : 'Family Photoshoot'}
                    </h3>
                    {getStatusIcon(session.status)}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Theme: {session.themes?.name || 'Custom'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Created: {formatRelativeTime(new Date(session.created_at))}
                    </p>
                    {session.generated_images && (
                      <p className="text-sm text-gray-600">
                        Images: {session.generated_images.filter((img: any) => img.status === 'completed').length} completed
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusText(session.status)}
                    </span>
                    
                    <span className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Load More (if needed for pagination) */}
      {filteredSessions.length > 0 && filteredSessions.length < sessions.length && (
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Showing {filteredSessions.length} of {sessions.length} photoshoots
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, sessionId: '', sessionName: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Photoshoot"
        message={`Are you sure you want to delete the photoshoot for "${deleteDialog.sessionName}"? This will permanently delete all generated images and cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  )
}
