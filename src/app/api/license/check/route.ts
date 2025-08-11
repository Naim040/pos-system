import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check if there's an existing activation in the request headers
    const activationKey = request.headers.get('x-activation-key')
    const licenseKey = request.headers.get('x-license-key')

    if (!activationKey || !licenseKey) {
      return NextResponse.json({
        activated: false,
        message: 'No activation information provided'
      })
    }

    // Find the activation
    const activation = await db.licenseActivation.findUnique({
      where: { activationKey },
      include: {
        license: true
      }
    })

    if (!activation || !activation.isActive) {
      return NextResponse.json({
        activated: false,
        message: 'Activation not found or inactive'
      })
    }

    // Verify the license key matches
    if (activation.license.licenseKey !== licenseKey) {
      return NextResponse.json({
        activated: false,
        message: 'License key mismatch'
      })
    }

    // Check license status
    if (activation.license.status !== 'active') {
      return NextResponse.json({
        activated: false,
        message: `License is ${activation.license.status}`
      })
    }

    // Check expiration
    if (activation.license.expiresAt && new Date() > new Date(activation.license.expiresAt)) {
      // Update license status to expired
      await db.license.update({
        where: { id: activation.license.id },
        data: { status: 'expired' }
      })
      
      return NextResponse.json({
        activated: false,
        message: 'License has expired'
      })
    }

    // Update last verified timestamp
    await db.license.update({
      where: { id: activation.license.id },
      data: { lastVerifiedAt: new Date() }
    })

    await db.licenseActivation.update({
      where: { id: activation.id },
      data: { lastVerifiedAt: new Date() }
    })

    // Return license information
    return NextResponse.json({
      activated: true,
      license: {
        id: activation.license.id,
        licenseKey: activation.license.licenseKey,
        type: activation.license.type,
        status: activation.license.status,
        clientName: activation.license.clientName,
        clientEmail: activation.license.clientEmail,
        maxUsers: activation.license.maxUsers,
        maxStores: activation.license.maxStores,
        expiresAt: activation.license.expiresAt,
        lastVerifiedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('License check error:', error)
    return NextResponse.json(
      { 
        activated: false,
        error: 'Failed to verify license',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { activationKey, licenseKey, systemInfo } = body

    if (!activationKey || !licenseKey) {
      return NextResponse.json(
        { error: 'Activation key and license key are required' },
        { status: 400 }
      )
    }

    // Find the activation
    const activation = await db.licenseActivation.findUnique({
      where: { activationKey },
      include: {
        license: true
      }
    })

    if (!activation || !activation.isActive) {
      return NextResponse.json(
        { error: 'Activation not found or inactive' },
        { status: 404 }
      )
    }

    // Verify the license key matches
    if (activation.license.licenseKey !== licenseKey) {
      return NextResponse.json(
        { error: 'License key mismatch' },
        { status: 403 }
      )
    }

    // Check license status
    if (activation.license.status !== 'active') {
      return NextResponse.json(
        { error: `License is ${activation.license.status}` },
        { status: 403 }
      )
    }

    // Check expiration
    if (activation.license.expiresAt && new Date() > new Date(activation.license.expiresAt)) {
      // Update license status to expired
      await db.license.update({
        where: { id: activation.license.id },
        data: { status: 'expired' }
      })
      
      return NextResponse.json(
        { error: 'License has expired' },
        { status: 403 }
      )
    }

    // Check for hardware/domain changes
    if (systemInfo) {
      const hardwareMismatch = systemInfo.hardwareId && activation.hardwareId && systemInfo.hardwareId !== activation.hardwareId
      const domainMismatch = systemInfo.domain && activation.domain && systemInfo.domain !== activation.domain

      if (hardwareMismatch || domainMismatch) {
        // Log suspicious activity
        console.warn(`Suspicious activity detected for activation ${activationKey}:`, {
          hardwareMismatch,
          domainMismatch,
          currentSystem: systemInfo,
          activationRecord: {
            hardwareId: activation.hardwareId,
            domain: activation.domain
          }
        })

        // Optionally deactivate the activation for security
        await db.licenseActivation.update({
          where: { id: activation.id },
          data: {
            isActive: false,
            deactivatedAt: new Date(),
            deactivationReason: 'Security violation - system mismatch'
          }
        })

        return NextResponse.json(
          { error: 'System configuration changed. Please reactivate your license.' },
          { status: 403 }
        )
      }
    }

    // Update verification timestamps
    await db.license.update({
      where: { id: activation.license.id },
      data: { lastVerifiedAt: new Date() }
    })

    await db.licenseActivation.update({
      where: { id: activation.id },
      data: { lastVerifiedAt: new Date() }
    })

    return NextResponse.json({
      valid: true,
      message: 'License verified successfully',
      license: {
        id: activation.license.id,
        licenseKey: activation.license.licenseKey,
        type: activation.license.type,
        status: activation.license.status,
        clientName: activation.license.clientName,
        clientEmail: activation.license.clientEmail,
        maxUsers: activation.license.maxUsers,
        maxStores: activation.license.maxStores,
        expiresAt: activation.license.expiresAt,
        lastVerifiedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('License verification error:', error)
    return NextResponse.json(
      { 
        valid: false,
        error: 'Failed to verify license',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}