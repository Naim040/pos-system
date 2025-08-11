import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { licenseId, domain, hardwareId, action = 'add' } = body

    if (!licenseId) {
      return NextResponse.json(
        { error: 'License ID is required' },
        { status: 400 }
      )
    }

    // Find the license
    const license = await db.license.findUnique({
      where: { id: licenseId }
    })

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      )
    }

    // Parse existing hardware binding
    const hardwareBinding = license.hardwareBinding ? JSON.parse(license.hardwareBinding) : {
      allowedHardwareIds: [],
      maxHardwareBindings: 1,
      allowedDomains: [],
      strictMode: false
    }

    if (action === 'add') {
      // Add domain to allowed domains
      if (domain && !hardwareBinding.allowedDomains.includes(domain)) {
        hardwareBinding.allowedDomains.push(domain)
      }

      // Add hardware ID to allowed hardware IDs
      if (hardwareId && !hardwareBinding.allowedHardwareIds.includes(hardwareId)) {
        if (hardwareBinding.allowedHardwareIds.length >= hardwareBinding.maxHardwareBindings) {
          return NextResponse.json(
            { error: 'Maximum hardware binding limit reached' },
            { status: 400 }
          )
        }
        hardwareBinding.allowedHardwareIds.push(hardwareId)
      }
    } else if (action === 'remove') {
      // Remove domain from allowed domains
      if (domain) {
        hardwareBinding.allowedDomains = hardwareBinding.allowedDomains.filter(d => d !== domain)
      }

      // Remove hardware ID from allowed hardware IDs
      if (hardwareId) {
        hardwareBinding.allowedHardwareIds = hardwareBinding.allowedHardwareIds.filter(h => h !== hardwareId)
      }
    } else if (action === 'update-settings') {
      // Update hardware binding settings
      const { maxHardwareBindings, strictMode } = body
      
      if (maxHardwareBindings !== undefined) {
        hardwareBinding.maxHardwareBindings = maxHardwareBindings
      }
      
      if (strictMode !== undefined) {
        hardwareBinding.strictMode = strictMode
      }
    }

    // Update the license with new hardware binding
    const updatedLicense = await db.license.update({
      where: { id: licenseId },
      data: {
        hardwareBinding: JSON.stringify(hardwareBinding)
      },
      include: {
        activations: true,
        payments: true
      }
    })

    return NextResponse.json({
      success: true,
      hardwareBinding,
      license: updatedLicense
    })

  } catch (error) {
    console.error('Hardware binding update error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update hardware binding',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const licenseId = searchParams.get('licenseId')

    if (!licenseId) {
      return NextResponse.json(
        { error: 'License ID is required' },
        { status: 400 }
      )
    }

    const license = await db.license.findUnique({
      where: { id: licenseId },
      include: {
        activations: {
          where: { isActive: true }
        }
      }
    })

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      )
    }

    // Parse hardware binding
    const hardwareBinding = license.hardwareBinding ? JSON.parse(license.hardwareBinding) : {
      allowedHardwareIds: [],
      maxHardwareBindings: 1,
      allowedDomains: [],
      strictMode: false
    }

    // Get current system information
    const currentSystem = {
      domain: request.headers.get('host') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }

    // Check if current system is allowed
    const isDomainAllowed = hardwareBinding.allowedDomains.length === 0 || 
                           hardwareBinding.allowedDomains.includes(currentSystem.domain) ||
                           hardwareBinding.allowedDomains.includes('*')

    const bindingStatus = {
      isAllowed: isDomainAllowed,
      currentSystem,
      hardwareBinding,
      activeActivations: license.activations,
      activationCount: license.activationCount,
      maxActivations: license.maxActivations
    }

    return NextResponse.json(bindingStatus)

  } catch (error) {
    console.error('Hardware binding check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check hardware binding',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}