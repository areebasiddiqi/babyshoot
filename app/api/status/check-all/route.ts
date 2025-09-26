import { NextRequest, NextResponse } from 'next/server'
import { DeploymentStatusChecker } from '@/lib/deploymentStatusChecker'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for security
    const authHeader = request.headers.get('authorization')
    const validTokens = [
      `Bearer ${process.env.CRON_SECRET}`,
      `Bearer ${process.env.INTERNAL_API_KEY}`,
    ].filter(Boolean)

    if (validTokens.length > 0 && !validTokens.includes(authHeader || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Starting batch status check...')

    const result = await DeploymentStatusChecker.checkAllPendingSessions()

    return NextResponse.json({
      success: true,
      message: 'Batch status check completed',
      ...result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Batch status check error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Allow GET for manual triggers
export async function GET(request: NextRequest) {
  return POST(request)
}
