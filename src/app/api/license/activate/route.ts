import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { licenseKey, clientEmail, systemInfo } = body

    if (!licenseKey || !clientEmail) {
      return NextResponse.json(
        { error: 'License key and client email are required' },
        { status: 400 }
      )
    }

    // Find the license
    const license = await db.license.findUnique({
      where: { licenseKey },
      include: {
        activations: {
          where: { isActive: true }
        }
      }
    })

    if (!license) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 404 }
      )
    }

    // Check license status
    if (license.status !== 'active') {
      return NextResponse.json(
        { error: `License is ${license.status}` },
        { status: 403 }
      )
    }

    // Check expiration
    if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
      // Update license status to expired
      await db.license.update({
        where: { id: license.id },
        data: { status: 'expired' }
      })
      
      return NextResponse.json(
        { error: 'License has expired' },
        { status: 403 }
      )
    }

    // Check if client email matches
    if (license.clientEmail.toLowerCase() !== clientEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Client email does not match license record' },
        { status: 403 }
      )
    }

    // Check activation limits
    if (license.activations.length >= license.maxActivations) {
      return NextResponse.json(
        { error: 'Maximum number of activations reached' },
        { status: 403 }
      )
    }

    // Check domain restrictions
    if (license.allowedDomains) {
      const allowedDomains = JSON.parse(license.allowedDomains)
      if (systemInfo?.domain && !allowedDomains.includes(systemInfo.domain)) {
        return NextResponse.json(
          { error: 'Domain not allowed for this license' },
          { status: 403 }
        )
      }
    }

    // Check hardware binding
    if (license.hardwareBinding) {
      const hardwareBinding = JSON.parse(license.hardwareBinding)
      if (systemInfo?.hardwareId && hardwareBinding.hardwareId && systemInfo.hardwareId !== hardwareBinding.hardwareId) {
        return NextResponse.json(
          { error: 'Hardware binding mismatch' },
          { status: 403 }
        )
      }
    }

    // Deactivate any existing activations for this system (if any)
    if (systemInfo?.hardwareId) {
      await db.licenseActivation.updateMany({
        where: {
          hardwareId: systemInfo.hardwareId,
          isActive: true
        },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: 'New activation on same hardware'
        }
      })
    }

    // Generate activation key
    const activationKey = generateActivationKey()

    // Create activation record
    const activation = await db.licenseActivation.create({
      data: {
        activationKey,
        licenseId: license.id,
        domain: systemInfo?.domain,
        hardwareId: systemInfo?.hardwareId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        isActive: true,
        activatedAt: new Date()
      }
    })

    // Update license activation count and last activated timestamp
    await db.license.update({
      where: { id: license.id },
      data: {
        activationCount: license.activationCount + 1,
        lastActivatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      activationKey,
      license: {
        id: license.id,
        licenseKey: license.licenseKey,
        type: license.type,
        status: license.status,
        clientName: license.clientName,
        clientEmail: license.clientEmail,
        maxUsers: license.maxUsers,
        maxStores: license.maxStores,
        expiresAt: license.expiresAt,
        lastVerifiedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('License activation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to activate license',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}