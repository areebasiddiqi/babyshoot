import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { SparklesIcon, ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin-utils'
import UserMenu from '@/components/UserMenu'
import ThemePreviewManager from '@/components/admin/ThemePreviewManager'

async function getTheme(themeId: string) {
  if (!supabaseAdmin.instance) {
    console.error('Supabase admin client not available')
    throw new Error('Supabase admin client not available')
  }

  console.log('Fetching theme with ID:', themeId)

  const { data: theme, error } = await supabaseAdmin.instance
    .from('themes')
    .select('id, name, description, category, preview_images')
    .eq('id', themeId)
    .single()

  if (error) {
    console.error('Database error fetching theme:', error)
    throw new Error(`Theme not found: ${error.message}`)
  }

  if (!theme) {
    console.error('No theme found with ID:', themeId)
    throw new Error('Theme not found')
  }

  console.log('Theme found:', theme)
  return theme
}

export default async function ThemePreviewImagesPage({ 
  params 
}: { 
  params: { themeId: string } 
}) {
  const { cookies } = await import('next/headers')
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return redirect('/sign-in')
  }

  const user = session.user
  const hasAdminAccess = await isAdmin(user.id)
  
  if (!hasAdminAccess) {
    return redirect('/dashboard')
  }

  let theme
  try {
    theme = await getTheme(params.themeId)
  } catch (error) {
    console.error('Theme not found:', error)
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="flex items-center space-x-2">
                <SparklesIcon className="h-8 w-8 text-primary-500" />
                <span className="text-xl font-bold gradient-text">Admin</span>
              </Link>
              <div className="hidden sm:block text-gray-300">|</div>
              <h1 className="hidden sm:block text-xl font-semibold text-gray-900">
                Preview Images
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href={`/admin/themes/${params.themeId}/edit`} className="btn-secondary">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Theme
              </Link>
              <UserMenu 
                userEmail={user.email || undefined}
                userName={user.user_metadata?.first_name || user.user_metadata?.name || undefined}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Theme Info */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
              <PhotoIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{theme.name}</h2>
              <p className="text-gray-600 capitalize">{theme.category} theme</p>
            </div>
          </div>
          <p className="text-gray-600 max-w-3xl">
            {theme.description}
          </p>
        </div>

        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/admin" className="text-gray-400 hover:text-gray-500">
                Admin
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <Link href="/admin/themes" className="text-gray-400 hover:text-gray-500">
                Themes
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <Link 
                href={`/admin/themes/${params.themeId}/edit`} 
                className="text-gray-400 hover:text-gray-500"
              >
                {theme.name}
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-900">Preview Images</span>
            </li>
          </ol>
        </nav>

        {/* Preview Manager */}
        <ThemePreviewManager
          themeId={theme.id}
          themeName={theme.name}
          initialPreviewImages={theme.preview_images || []}
        />

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Preview Image Guidelines
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Image Quality:</strong> Use high-resolution images (minimum 400x600px)</p>
            <p>• <strong>Format:</strong> JPEG, PNG, or WebP formats work best</p>
            <p>• <strong>Content:</strong> Images should represent the theme style and mood</p>
            <p>• <strong>Quantity:</strong> 3-5 images provide a good preview experience</p>
            <p>• <strong>Order:</strong> First image will be used as the main thumbnail</p>
            <p>• <strong>URLs:</strong> Use direct links to images (not webpage URLs)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
