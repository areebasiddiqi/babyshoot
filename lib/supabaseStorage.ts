import { supabaseAdmin } from '@/lib/supabase'

export class SupabaseStorageManager {
  private static readonly BUCKET_NAME = 'generated-images'

  /**
   * Download image from URL and upload to Supabase Storage
   */
  static async downloadAndStoreImage(
    imageUrl: string, 
    sessionId: string, 
    imageId: string
  ): Promise<string | null> {
    try {
      if (!supabaseAdmin.instance) {
        console.error('Supabase admin client not available')
        return null
      }

      console.log(`📥 Downloading image from: ${imageUrl}`)
      
      // Download the image from Astria
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`)
      }

      const imageBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      
      // Determine file extension from content type
      const fileExtension = contentType.includes('png') ? 'png' : 'jpg'
      
      // Generate file path: sessions/[sessionId]/[imageId].jpg
      const filePath = `sessions/${sessionId}/${imageId}.${fileExtension}`

      console.log(`📤 Uploading to Supabase Storage: ${filePath}`)

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.instance.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, imageBuffer, {
          contentType,
          upsert: true
        })

      if (error) {
        throw new Error(`Failed to upload to Supabase Storage: ${error.message}`)
      }

      // Get the public URL
      const { data: publicUrlData } = supabaseAdmin.instance.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath)

      const publicUrl = publicUrlData.publicUrl
      console.log(`✅ Image stored successfully: ${publicUrl}`)
      return publicUrl

    } catch (error) {
      console.error('Error downloading and storing image:', error)
      return null
    }
  }

  /**
   * Delete image from Supabase Storage
   */
  static async deleteImage(sessionId: string, imageId: string): Promise<boolean> {
    try {
      if (!supabaseAdmin.instance) {
        console.error('Supabase admin client not available')
        return false
      }

      const filePaths = [
        `sessions/${sessionId}/${imageId}.jpg`,
        `sessions/${sessionId}/${imageId}.png`
      ]

      for (const filePath of filePaths) {
        const { error } = await supabaseAdmin.instance.storage
          .from(this.BUCKET_NAME)
          .remove([filePath])

        if (!error) {
          console.log(`🗑️ Deleted image: ${filePath}`)
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error deleting image:', error)
      return false
    }
  }

  /**
   * Ensure the storage bucket exists and is properly configured
   */
  static async ensureBucketExists(): Promise<boolean> {
    try {
      if (!supabaseAdmin.instance) {
        console.error('Supabase admin client not available')
        return false
      }

      // Check if bucket exists
      const { data: buckets, error: listError } = await supabaseAdmin.instance.storage.listBuckets()
      
      if (listError) {
        console.error('Error listing buckets:', listError)
        return false
      }

      const bucketExists = buckets?.some((bucket: any) => bucket.name === this.BUCKET_NAME)

      if (!bucketExists) {
        console.log(`📦 Creating bucket: ${this.BUCKET_NAME}`)
        
        // Create the bucket
        const { error: createError } = await supabaseAdmin.instance.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
        })

        if (createError) {
          console.error('Error creating bucket:', createError)
          return false
        }

        console.log(`✅ Bucket created: ${this.BUCKET_NAME}`)
      }

      return true
    } catch (error) {
      console.error('Error ensuring bucket exists:', error)
      return false
    }
  }
}
