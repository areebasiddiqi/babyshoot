import { statusChecker } from './statusChecker'

// Initialize the status checker when the app starts
export function initializeApp() {
  console.log('🚀 Initializing BabyShoot AI application...')
  
  // Start the automatic status checker
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_STATUS_CHECKER === 'true') {
    console.log('🔄 Starting automatic status checker...')
    statusChecker.start()
  } else {
    console.log('⏸️ Status checker disabled in development mode')
    console.log('💡 Set ENABLE_STATUS_CHECKER=true to enable in development')
  }
}

// Auto-initialize when this module is imported
if (typeof window === 'undefined') {
  // Only run on server-side
  initializeApp()
}
