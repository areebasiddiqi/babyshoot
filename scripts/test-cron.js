// Test script to manually trigger the cron job
const fetch = require('node-fetch')

async function testCronJob() {
  try {
    console.log('🔄 Testing cron job...')
    
    const response = await fetch('http://localhost:3000/api/cron/check-training-status', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your_secure_cron_secret_key_here',
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    console.log('📊 Cron job result:', JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testCronJob()
