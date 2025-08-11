import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

// Helper function to validate license key format
function isValidLicenseKey(key: string): boolean {
  const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return regex.test(key)
}

export async function GET() {
  try {
    const licenses = await db.license.findMany({
      include: {
        activations: {
          where: { isActive: true }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(licenses)
  } catch (error) {
    console.error('Error fetching licenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, 
      clientName, 
      clientEmail, 
      maxUsers = 1, 
      maxStores = 1, 
      allowedDomains,
      hardwareBinding,
      notes,
      createdBy,
      franchiseId,
      franchiseClientId
    } = body

    if (!type || !clientName || !clientEmail) {
      return NextResponse.json(
        { error: 'Type, client name, and client email are required' },
        { status: 400 }
      )
    }

    if (!['lifetime', 'monthly', 'yearly'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid license type. Must be lifetime, monthly, or yearly' },
        { status: 400 }
      )
    }

    // If franchiseClientId is provided, validate it belongs to the franchise
    if (franchiseClientId) {
      if (!franchiseId) {
        return NextResponse.json(
          { error: 'Franchise ID is required when franchise client ID is provided' },
          { status: 400 }
        )
      }

      const franchiseClient = await db.franchiseClient.findUnique({
        where: { id: franchiseClientId }
      })

      if (!franchiseClient || franchiseClient.franchiseId !== franchiseId) {
        return NextResponse.json(
          { error: 'Invalid franchise client ID' },
          { status: 400 }
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
        clientName,
        clientEmail,
        franchiseId,
        franchiseClientId,
        maxUsers,
        maxStores,
        allowedDomains: allowedDomains ? JSON.stringify(allowedDomains) : null,
        hardwareBinding: hardwareBinding ? JSON.stringify(hardwareBinding) : null,
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

    // If this is a franchise client license, update the client status
    if (franchiseClientId) {
      await db.franchiseClient.update({
        where: { id: franchiseClientId },
        data: {
          status: 'active'
        }
      })
    }

    return NextResponse.json(license, { status: 201 })
  } catch (error) {
    console.error('Error creating license:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create license',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Helper function to generate multiple license keys
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'generate-batch') {
      const { count = 1, ...licenseData } = data
      const licenses = []

      for (let i = 0; i < count; i++) {
        const licenseKey = generateLicenseKey()
        let expiresAt = null

        if (licenseData.type === 'monthly') {
          expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + 1)
        } else if (licenseData.type === 'yearly') {
          expiresAt = new Date()
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        }

        const license = await db.license.create({
          data: {
            licenseKey,
            ...licenseData,
            expiresAt
          }
        })

        licenses.push(license)
      }

      return NextResponse.json({ licenses, count })
    }

    if (action === 'update-hardware-binding') {
      const { licenseId, hardwareBinding } = data
      
      const license = await db.license.update({
        where: { id: licenseId },
        data: {
          hardwareBinding: JSON.stringify(hardwareBinding)
        },
        include: {
          activations: true,
          payments: true
        }
      })

      return NextResponse.json(license)
    }

    if (action === 'update-domains') {
      const { licenseId, allowedDomains } = data
      
      const license = await db.license.update({
        where: { id: licenseId },
        data: {
          allowedDomains: JSON.stringify(allowedDomains)
        },
        include: {
          activations: true,
          payments: true
        }
      })

      return NextResponse.json(license)
    }

    if (action === 'update-status') {
      const { licenseId, status } = data
      const license = await db.license.update({
        where: { id: licenseId },
        data: { status },
        include: {
          activations: true,
          payments: true
        }
      })

      return NextResponse.json(license)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating licenses:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update licenses',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}