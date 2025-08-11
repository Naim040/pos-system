import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message } = body

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(to.replace(/[\s\-\(\)]/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const result = await smsService.sendTestSMS(to, message)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending test SMS:', error)
    return NextResponse.json(
      { error: 'Failed to send test SMS' },
      { status: 500 }
    )
  }
}