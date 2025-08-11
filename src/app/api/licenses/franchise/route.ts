import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

// Helper function to generate license keys
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-'
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Helper function to generate activation key
function generateActivationKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    if (i > 0 && i % 8 === 0) result += '-'
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Create license for franchise client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      franchiseClientId,
      type = 'monthly',
      maxUsers = 1,
      maxStores = 1,
      notes,
      createdBy
    } = body

    if (!franchiseClientId) {
      return NextResponse.json(
        { error: 'Franchise client ID is required' },
        { status: 400 }
      )
    }

    // Get franchise client details
    const franchiseClient = await db.franchiseClient.findUnique({
      where: { id: franchiseClientId },
      include: {
        franchise: true
      }
    })

    if (!franchiseClient) {
      return NextResponse.json(
        { error: 'Franchise client not found' },
        { status: 404 }
      )
    }

    // Check if client already has a license
    const existingLicense = await db.license.findFirst({
      where: { franchiseClientId }
    })

    if (existingLicense) {
      return NextResponse.json(
        { error: 'Franchise client already has a license' },
        { status: 409 }
      )
    }

    // Generate license key
    const licenseKey = generateLicenseKey()
    
    // Calculate expiration date for non-lifetime licenses
    let expiresAt = null
    if (type === 'monthly') {
      expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else if (type === 'yearly') {
      expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    // Create the license
    const license = await db.license.create({
      data: {
        licenseKey,
        type,
        clientName: franchiseClient.clientName,
        clientEmail: franchiseClient.clientEmail,
        franchiseId: franchiseClient.franchiseId,
        franchiseClientId,
        maxUsers,
        maxStores,
        notes,
        createdBy: createdBy || 'system',
        expiresAt
      },
      include: {
        activations: true,
        payments: true,
        franchise: true,
        franchiseClient: true
      }
    })

    // Create activation for the license
    const activation = await db.licenseActivation.create({
      data: {
        licenseId: license.id,
        activationKey: generateActivationKey(),
        isActive: true
      }
    })

    // Update franchise client status
    await db.franchiseClient.update({
      where: { id: franchiseClientId },
      data: {
        status: 'active'
      }
    })

    return NextResponse.json({
      license,
      activation: {
        activationKey: activation.activationKey
      },
      message: 'License created successfully for franchise client'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating franchise license:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create franchise license',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Get licenses for a specific franchise
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const franchiseId = searchParams.get('franchiseId')
    const clientId = searchParams.get('clientId')

    if (!franchiseId) {
      return NextResponse.json(
        { error: 'Franchise ID is required' },
        { status: 400 }
      )
    }

    const where: any = { franchiseId }
    if (clientId) where.franchiseClientId = clientId

    const licenses = await db.license.findMany({
      where,
      include: {
        activations: {
          where: { isActive: true }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        franchiseClient: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ licenses })
  } catch (error) {
    console.error('Error fetching franchise licenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch franchise licenses' },
      { status: 500 }
    )
  }
}