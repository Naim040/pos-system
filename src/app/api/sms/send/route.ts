import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, type, data } = body

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'new_sale':
        if (!data?.invoiceId || !data?.amount || !data?.storeName) {
          return NextResponse.json(
            { error: 'Missing required data for new sale SMS' },
            { status: 400 }
          )
        }
        result = await smsService.sendNewSaleSMS(to, data)
        break

      case 'due_reminder':
        if (!data?.customerName || !data?.amount || !data?.dueDate || !data?.storeName) {
          return NextResponse.json(
            { error: 'Missing required data for due reminder SMS' },
            { status: 400 }
          )
        }
        result = await smsService.sendDueReminderSMS(to, data)
        break

      case 'daily_summary':
        if (!data?.date || !data?.totalSales || !data?.transactionCount || !data?.averageTransaction || !data?.storeName) {
          return NextResponse.json(
            { error: 'Missing required data for daily summary SMS' },
            { status: 400 }
          )
        }
        result = await smsService.sendDailySalesSummarySMS([to], data)
        result = result[0] // Get first result since we're sending to one number
        break

      case 'otp':
        if (!data?.otp) {
          return NextResponse.json(
            { error: 'OTP code is required' },
            { status: 400 }
          )
        }
        result = await smsService.sendOTPSMS(to, data.otp)
        break

      case 'delivery_update':
        if (!data?.orderId || !data?.status || !data?.storeName) {
          return NextResponse.json(
            { error: 'Missing required data for delivery update SMS' },
            { status: 400 }
          )
        }
        result = await smsService.sendDeliveryUpdateSMS(to, data)
        break

      default:
        // Generic SMS
        result = await smsService.sendSMS(to, message)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending SMS:', error)
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    )
  }
}