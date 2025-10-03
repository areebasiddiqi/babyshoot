export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface Child {
  id: string
  userId: string
  user_id?: string
  name: string
  ageInMonths?: number
  age_in_months?: number
  gender: 'boy' | 'girl' | 'other'
  hairColor?: string
  hair_color?: string
  hairStyle?: string
  hair_style?: string
  eyeColor?: string
  eye_color?: string
  skinTone?: string
  skin_tone?: string
  uniqueFeatures?: string
  unique_features?: string
  createdAt?: Date
  created_at?: Date
  updatedAt?: Date
  updated_at?: Date
}

export interface PhotoshootSession {
  id: string
  userId: string
  childId: string
  status: 'pending' | 'training' | 'ready' | 'generating' | 'completed' | 'failed'
  modelId?: string
  trainingJobId?: string
  uploadedPhotos: string[]
  selectedTheme: Theme
  generatedImages: GeneratedImage[]
  createdAt: Date
  updatedAt: Date
}

export interface Theme {
  id: string
  name: string
  description: string
  prompt: string
  thumbnailUrl: string
  category: 'newborn' | 'toddler' | 'family' | 'seasonal' | 'fantasy'
  isActive: boolean
  previewImages?: string[] // Array of preview image URLs
  prompts?: ThemePrompt[] // Associated prompts from theme_prompts table
}

export interface ThemePrompt {
  id: string
  prompt_text: string
  prompt_order: number
  is_active: boolean
}

export interface GeneratedImage {
  id: string
  sessionId: string
  imageUrl: string
  thumbnailUrl: string
  prompt: string
  seed?: number
  status: 'generating' | 'completed' | 'failed'
  createdAt: Date
}

export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'pro'
  status: 'active' | 'canceled' | 'past_due'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  photoshootsUsed: number
  photoshootsLimit: number
}

export interface AstriaTrainingJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  model_id?: string
  progress?: number
  eta?: number
  error?: string
}

export interface AstriaGenerationJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  images?: string[]
  error?: string
}

export interface FormData {
  childName: string
  ageInMonths: number
  gender: 'boy' | 'girl' | 'other'
  hairColor: string
  hairStyle: string
  eyeColor: string
  skinTone: string
  uniqueFeatures?: string
}

export interface UploadedFile {
  file: File | null
  preview: string
  id: string
  isExisting?: boolean
}
