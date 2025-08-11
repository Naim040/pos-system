import { NextResponse } from 'next/server'
import { PREDEFINED_GATEWAYS } from '@/types/sms'

export async function GET() {
  try {
    return NextResponse.json({
      gateways: PREDEFINED_GATEWAYS,
      count: PREDEFINED_GATEWAYS.length
    })
  } catch (error) {
    console.error('Error fetching SMS gateways:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS gateways' },
      { status: 500 }
    )
  }
}