import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get app settings
    let settings = await db.appSettings.findUnique({
      where: { id: '1' }
    })

    // If no settings exist in DB, return defaults from environment or hardcoded defaults
    if (!settings) {
      settings = {
        id: '1',
        contactPhone: process.env.DEFAULT_CONTACT_PHONE || '01938264923',
        developerCredit: process.env.DEFAULT_DEVELOPER_CREDIT || 'Developed by Halalzi',
        developerUrl: process.env.DEFAULT_DEVELOPER_URL || null,
        updatedByUserId: null,
        updatedAt: new Date(),
        createdAt: new Date()
      }
    }

    // Return only the public fields
    return NextResponse.json({
      contactPhone: settings.contactPhone,
      developerCredit: settings.developerCredit,
      developerUrl: settings.developerUrl
    })
  } catch (error) {
    console.error('Error fetching public settings:', error)
    
    // Return fallback defaults if there's an error
    return NextResponse.json({
      contactPhone: process.env.DEFAULT_CONTACT_PHONE || '01938264923',
      developerCredit: process.env.DEFAULT_DEVELOPER_CREDIT || 'Developed by Halalzi',
      developerUrl: process.env.DEFAULT_DEVELOPER_URL || null
    })
  }
}