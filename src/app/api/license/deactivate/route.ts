import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { activationKey, licenseKey, reason = 'Manual deactivation' } = body

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

    if (!activation) {
      return NextResponse.json(
        { error: 'Activation not found' },
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

    // Deactivate the activation
    const deactivatedActivation = await db.licenseActivation.update({
      where: { id: activation.id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: reason
      }
    })

    // Update license activation count
    await db.license.update({
      where: { id: activation.license.id },
      data: {
        activationCount: Math.max(0, activation.license.activationCount - 1)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'License deactivated successfully',
      deactivatedAt: deactivatedActivation.deactivatedAt
    })

  } catch (error) {
    console.error('License deactivation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to deactivate license',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}