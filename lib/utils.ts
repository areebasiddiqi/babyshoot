import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAge(ageInMonths: number): string {
  if (ageInMonths < 12) {
    return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`
  }
  
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12
  
  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`
  }
  
  return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
}

export function generateBasePrompt(child: {
  name: string
  ageInMonths: number
  gender: string
  hairColor: string
  hairStyle: string
  eyeColor: string
  skinTone: string
  uniqueFeatures?: string
}): string {
  const ageDescription = child.ageInMonths < 6 ? 'newborn baby' : 
                        child.ageInMonths < 12 ? 'infant baby' :
                        child.ageInMonths < 24 ? 'toddler' : 'young child'
  
  let prompt = `Photorealistic portrait of a beautiful ${ageDescription}`
  
  if (child.gender !== 'other') {
    prompt += ` ${child.gender}`
  }
  
  prompt += ` with ${child.hairStyle} ${child.hairColor} hair, ${child.eyeColor} eyes, ${child.skinTone} skin tone`
  
  if (child.uniqueFeatures) {
    prompt += `, ${child.uniqueFeatures}`
  }
  
  prompt += ', smiling happily, professional photography, high quality, 8k resolution, soft lighting'
  
  return prompt
}

export function enhancePromptWithTheme(basePrompt: string, themePrompt: string): string {
  return `${themePrompt}, ${basePrompt}, masterpiece, award-winning photography, perfect composition, beautiful lighting`
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPEG, PNG, or WebP image' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be smaller than 10MB' }
  }
  
  return { valid: true }
}

export function resizeImage(file: File, maxWidth: number = 1024, maxHeight: number = 1024): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      const { width, height } = img
      
      // Calculate new dimensions
      let newWidth = width
      let newHeight = height
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        newWidth = width * ratio
        newHeight = height * ratio
      }
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/jpeg', 0.9)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  }
  
  return formatDate(date)
}

export function generateSessionId(): string {
  // Generate a UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Model reuse utilities
export function isModelValid(updatedAt: string, daysValid: number = 30): boolean {
  const modelDate = new Date(updatedAt)
  const expirationDate = new Date(modelDate.getTime() + (daysValid * 24 * 60 * 60 * 1000))
  return new Date() < expirationDate
}

export function getModelExpirationDate(updatedAt: string, daysValid: number = 30): Date {
  const modelDate = new Date(updatedAt)
  return new Date(modelDate.getTime() + (daysValid * 24 * 60 * 60 * 1000))
}

export function getDaysUntilExpiration(updatedAt: string, daysValid: number = 30): number {
  const expirationDate = getModelExpirationDate(updatedAt, daysValid)
  const now = new Date()
  const diffTime = expirationDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Generate family prompt for AI training
export function generateFamilyPrompt(familyMembers: any[]): string {
  const memberDescriptions = familyMembers.map(member => {
    let desc = `${member.name} (${member.relation}, ${member.gender}`
    if (member.age) {
      desc += `, ${member.age}`
    }
    desc += ')'
    return desc
  }).join(', ')

  return `Family portrait featuring ${memberDescriptions}. Professional family photography style, warm and natural lighting, genuine expressions and interactions between family members.`
}

// Generate family fingerprint for model reuse matching
export function generateFamilyFingerprint(familyMembers: any[]): string {
  // Sort family members by relation and gender for consistent fingerprinting
  const sortedMembers = [...familyMembers].sort((a, b) => {
    if (a.relation !== b.relation) {
      return a.relation.localeCompare(b.relation)
    }
    return a.gender.localeCompare(b.gender)
  })

  // Create fingerprint based on family composition (excluding names for privacy)
  const fingerprint = sortedMembers.map(member => {
    let fp = `${member.relation}_${member.gender}`
    // Include age range instead of exact age for better matching
    if (member.age) {
      const ageNum = parseInt(member.age.toString())
      if (!isNaN(ageNum)) {
        if (ageNum < 5) fp += '_toddler'
        else if (ageNum < 13) fp += '_child'
        else if (ageNum < 20) fp += '_teen'
        else if (ageNum < 65) fp += '_adult'
        else fp += '_senior'
      }
    }
    return fp
  }).join('|')

  return fingerprint
}

// Check if two family compositions are similar enough for model reuse
export function areFamilyCompositionsSimilar(members1: any[], members2: any[]): boolean {
  const fp1 = generateFamilyFingerprint(members1)
  const fp2 = generateFamilyFingerprint(members2)
  
  // Exact match for now - could be made more flexible in the future
  return fp1 === fp2
}
