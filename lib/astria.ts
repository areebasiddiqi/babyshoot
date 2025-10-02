import axios from 'axios'
import { AstriaTrainingJob, AstriaGenerationJob } from '@/types'

const ASTRIA_API_KEY = process.env.ASTRIA_API_KEY!
const ASTRIA_BASE_URL = process.env.ASTRIA_BASE_URL || 'https://api.astria.ai'

const astriaClient = axios.create({
  baseURL: ASTRIA_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ASTRIA_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

export class AstriaAPI {
  // Create a fine-tuning job (tune)
  static async createFineTuning(imageDataUrls: string[], prompt: string): Promise<AstriaTrainingJob> {
    try {
      console.log('Creating Astria tune with', imageDataUrls.length, 'images')
      
      // Convert data URLs to File objects for multipart upload
      const formData = new FormData()
      
      // Add required parameters (nested under tune[])
      formData.append('tune[title]', `tune_${Date.now()}`) // Unique title for idempotency
      formData.append('tune[name]', 'person') // Class name
      formData.append('tune[base_tune_id]', '1504944') // Flux1.dev base model ID
      formData.append('tune[model_type]', 'lora') // LoRA model type
      formData.append('tune[token]', 'ohwx') // Token for prompts
      
      // Add images as files (nested under tune[images][])
      for (let i = 0; i < imageDataUrls.length; i++) {
        const dataUrl = imageDataUrls[i]
        
        // Convert data URL back to buffer for proper upload
        const base64Data = dataUrl.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        const blob = new Blob([buffer], { type: 'image/jpeg' })
        
        formData.append('tune[images][]', blob, `image_${i}.jpg`)
      }
      
      const response = await astriaClient.post('/tunes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      console.log('Astria tune created:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Astria fine-tuning error:', error)
      if (error.response) {
        console.error('Astria API response:', error.response.status, error.response.data)
      }
      throw new Error('Failed to start fine-tuning')
    }
  }

  // Check training status
  static async getTrainingStatus(tuneId: string): Promise<AstriaTrainingJob> {
    try {
      const response = await astriaClient.get(`/tunes/${tuneId}`)
      return response.data
    } catch (error: any) {
      console.error('Astria training status error:', error)
      if (error.response) {
        console.error('Astria API response:', error.response.status, error.response.data)
      }
      throw new Error('Failed to get training status')
    }
  }

  // Generate images using fine-tuned model (create a prompt)
  static async generateImages(
    tuneId: string, 
    prompt: string, 
    numImages: number = 4
  ): Promise<AstriaGenerationJob> {
    try {
      console.log(`Creating prompt for tune ${tuneId} with ${numImages} images`)
      
      const response = await astriaClient.post(`/tunes/${tuneId}/prompts`, {
        prompt: {
          text: prompt,
          num_images: numImages,
          steps: 300,
          cfg_scale: 4, // Must be less than 5 according to Astria API
          seed: -1, // Random seed
          super_resolution: true,
          inpaint_faces: true,
          w: 1024,
          h: 1024
        }
      })
      
      console.log('Astria prompt created:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Astria generation error:', error)
      if (error.response) {
        console.error('Astria API response:', error.response.status, error.response.data)
      }
      throw new Error('Failed to generate images')
    }
  }

  // Check generation status
  static async getGenerationStatus(tuneId: string, promptId: string): Promise<AstriaGenerationJob> {
    try {
      const response = await astriaClient.get(`/tunes/${tuneId}/prompts/${promptId}`)
      return response.data
    } catch (error: any) {
      console.error('Astria generation status error:', error)
      if (error.response) {
        console.error('Astria API response:', error.response.status, error.response.data)
      }
      throw new Error('Failed to get generation status')
    }
  }

  // Note: Astria doesn't have a separate upload endpoint
  // Images are uploaded directly when creating a tune
  static async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    // For Astria API, we need to store the image temporarily and return a data URL
    // or use a temporary storage service. For now, we'll return a base64 data URL
    try {
      console.log(`Astria API: Preparing ${filename} (${imageBuffer.length} bytes) for tune creation`)
      
      // Convert buffer to base64 data URL
      const base64 = imageBuffer.toString('base64')
      const mimeType = filename.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${base64}`
      
      console.log(`Successfully prepared ${filename} as data URL`)
      return dataUrl
    } catch (error: any) {
      console.error('Failed to prepare image:', error)
      throw new Error(`Failed to prepare image: ${error.message}`)
    }
  }
}

// Fallback to Replicate API if Astria fails
export class ReplicateAPI {
  static async generateImages(prompt: string, numImages: number = 4) {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
    
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured')
    }

    try {
      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
          input: {
            prompt: prompt,
            num_outputs: numImages,
            width: 1024,
            height: 1024,
            guidance_scale: 7,
            num_inference_steps: 30,
          },
        },
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Replicate generation error:', error)
      throw new Error('Failed to generate images with Replicate')
    }
  }
}
