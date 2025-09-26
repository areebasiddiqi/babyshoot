// Test script to manually trigger the generation status cron job
const fetch = require('node-fetch')

async function testGenerationCron() {
  try {
    console.log('🖼️ Testing generation status cron job...')
    
    const response = await fetch('http://localhost:3000/api/cron/check-generation-status', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your_secure_cron_secret_key_here',
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    console.log('📊 Generation cron job result:', JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testGenerationCron()
