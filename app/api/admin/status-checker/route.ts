import { NextRequest, NextResponse } from 'next/server'
import { statusChecker } from '@/lib/statusChecker'

export async function GET(request: NextRequest) {
  try {
    const status = statusChecker.getStatus()
    
    return NextResponse.json({
      message: 'Status checker information',
      ...status
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get status checker info',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'start') {
      statusChecker.start()
      return NextResponse.json({
        message: 'Status checker started',
        status: statusChecker.getStatus()
      })
    } else if (action === 'stop') {
      statusChecker.stop()
      return NextResponse.json({
        message: 'Status checker stopped',
        status: statusChecker.getStatus()
      })
    } else if (action === 'check') {
      // Manual check
      await statusChecker.checkAllSessions()
      return NextResponse.json({
        message: 'Manual status check completed',
        status: statusChecker.getStatus()
      })
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "start", "stop", or "check"' 
      }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to control status checker',
      details: error.message 
    }, { status: 500 })
  }
}
