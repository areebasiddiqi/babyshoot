export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    photoshoots_limit: 1,
    images_per_shoot: 4,
    features: [
      '1 photoshoot per month',
      '4 generated images',
      '3 theme options',
      'Standard resolution',
      'Email support'
    ]
  },
  PRO: {
    name: 'Pro',
    price: 999, // $9.99 in cents
    photoshoots_limit: 999,
    images_per_shoot: 8,
    features: [
      'Unlimited photoshoots',
      '8 generated images per shoot',
      'All theme options',
      'High resolution (1024x1024)',
      'Priority support',
      'Commercial license',
      'Early access to new features'
    ]
  }
} as const

export const THEME_CATEGORIES = {
  NEWBORN: 'newborn',
  TODDLER: 'toddler',
  FAMILY: 'family',
  SEASONAL: 'seasonal',
  FANTASY: 'fantasy'
} as const

export const SESSION_STATUS = {
  PENDING: 'pending',
  TRAINING: 'training',
  READY: 'ready',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const

export const IMAGE_STATUS = {
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due'
} as const

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const MIN_PHOTOS_REQUIRED = 3
export const MAX_PHOTOS_ALLOWED = 10

export const POLLING_INTERVALS = {
  TRAINING: 60000, // 1 minute (60 seconds)
  GENERATING: 60000, // 1 minute (60 seconds)
  COMPLETED: 0 // No polling
} as const

export const ASTRIA_CONFIG = {
  BASE_MODEL: 'flux',
  TRAINING_STEPS: 500,
  LEARNING_RATE: 1e-4,
  BATCH_SIZE: 1,
  TRIGGER_WORD: 'TOK',
  GENERATION_STEPS: 30,
  CFG_SCALE: 7,
  IMAGE_SIZE: 1024
} as const
