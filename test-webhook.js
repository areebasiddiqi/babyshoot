// Simple test script to verify Stripe webhook is working
// Run with: node test-webhook.js

const WEBHOOK_URL = 'https://your-project-id.supabase.co/functions/v1/stripe-webhook'

async function testWebhook() {
  console.log('🧪 Testing Stripe webhook endpoint...')
  
  try {
    // Test 1: OPTIONS request (CORS preflight)
    console.log('\n1. Testing CORS preflight (OPTIONS)...')
    const optionsResponse = await fetch(WEBHOOK_URL, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'stripe-signature',
      }
    })
    
    console.log(`   Status: ${optionsResponse.status}`)
    console.log(`   CORS Headers: ${optionsResponse.headers.get('Access-Control-Allow-Origin')}`)
    
    // Test 2: POST without signature (should fail gracefully)
    console.log('\n2. Testing POST without signature...')
    const noSigResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' })
    })
    
    console.log(`   Status: ${noSigResponse.status}`)
    const noSigText = await noSigResponse.text()
    console.log(`   Response: ${noSigText}`)
    
    // Test 3: Check if webhook endpoint is reachable
    console.log('\n3. Testing webhook endpoint reachability...')
    const reachResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid_signature_for_test'
      },
      body: JSON.stringify({ test: 'data' })
    })
    
    console.log(`   Status: ${reachResponse.status}`)
    const reachText = await reachResponse.text()
    console.log(`   Response: ${reachText}`)
    
    console.log('\n✅ Webhook endpoint tests completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Update WEBHOOK_URL in this script with your actual Supabase project URL')
    console.log('2. Configure Stripe webhook to point to your endpoint')
    console.log('3. Add environment variables to Supabase Edge Functions')
    console.log('4. Test with actual Stripe webhook events')
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('- Check if your Supabase project URL is correct')
    console.log('- Ensure Edge Functions are deployed')
    console.log('- Verify network connectivity')
  }
}

// Run the test
testWebhook()
