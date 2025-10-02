import { NextRequest, NextResponse } from 'next/server'
import { statusChecker } from '@/lib/statusChecker'

export async function GET(request: NextRequest) {
  try {
    const status = statusChecker.instance.getStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting status checker status:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'start') {
      statusChecker.start()
      return NextResponse.json({ message: 'Status checker started' })
    } else if (action === 'stop') {
      statusChecker.stop()
      return NextResponse.json({ message: 'Status checker stopped' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error controlling status checker:', error)
    return NextResponse.json({ error: 'Failed to control status checker' }, { status: 500 })
  }
}
