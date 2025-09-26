// Initialize the application
export function initializeApp() {
  console.log('🚀 Initializing BabyShoot AI application...')
  
  // Note: Interval-based status checking is disabled for serverless deployments
  // Use the following alternatives instead:
  // 1. Client-side polling (already implemented in usePhotoshootStatus hook)
  // 2. External cron service calling /api/status/check-all
  // 3. Webhook-based updates from Astria
  
  console.log('✅ Application initialized for serverless deployment')
  console.log('💡 Status checking handled by client-side polling and webhooks')
}

// Auto-initialize when this module is imported
if (typeof window === 'undefined') {
  // Only run on server-side
  initializeApp()
}
