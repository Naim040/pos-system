import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only SUPER_ADMIN can update settings' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { contactPhone, developerCredit, developerUrl } = body

    // Validate input
    if (!contactPhone || typeof contactPhone !== 'string') {
      return NextResponse.json(
        { error: 'Contact phone is required and must be a string' },
        { status: 400 }
      )
    }

    if (!developerCredit || typeof developerCredit !== 'string') {
      return NextResponse.json(
        { error: 'Developer credit is required and must be a string' },
        { status: 400 }
      )
    }

    if (developerUrl && typeof developerUrl !== 'string') {
      return NextResponse.json(
        { error: 'Developer URL must be a string if provided' },
        { status: 400 }
      )
    }

    // Update or create settings
    const settings = await db.appSettings.upsert({
      where: { id: '1' },
      update: {
        contactPhone,
        developerCredit,
        developerUrl: developerUrl || null,
        updatedByUserId: session.user.id
      },
      create: {
        id: '1',
        contactPhone,
        developerCredit,
        developerUrl: developerUrl || null,
        updatedByUserId: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        contactPhone: settings.contactPhone,
        developerCredit: settings.developerCredit,
        developerUrl: settings.developerUrl,
        updatedAt: settings.updatedAt
      }
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only SUPER_ADMIN can view settings' },
        { status: 403 }
      )
    }

    // Get app settings
    const settings = await db.appSettings.findUnique({
      where: { id: '1' }
    })

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      contactPhone: settings.contactPhone,
      developerCredit: settings.developerCredit,
      developerUrl: settings.developerUrl,
      updatedAt: settings.updatedAt,
      updatedByUserId: settings.updatedByUserId
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}