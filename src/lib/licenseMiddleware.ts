import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface LicenseInfo {
  licenseId: string
  licenseKey: string
  activationKey: string
  clientEmail: string
  clientName: string
  type: string
  maxUsers: number
  maxStores: number
  expiresAt?: string
  activatedAt: string
  domain?: string
  hardwareId?: string
}

// Helper function to get license info from request headers
function getLicenseInfoFromRequest(request: NextRequest): LicenseInfo | null {
  const licenseKey = request.headers.get('x-license-key')
  const activationKey = request.headers.get('x-activation-key')
  
  if (!licenseKey || !activationKey) {
    return null
  }

  return {
    licenseId: '',
    licenseKey,
    activationKey,
    clientEmail: '',
    clientName: '',
    type: '',
    maxUsers: 1,
    maxStores: 1,
    activatedAt: ''
  }
}

// Helper function to verify license from database
async function verifyLicenseFromDB(licenseInfo: LicenseInfo): Promise<{ valid: boolean; license?: any; error?: string }> {
  try {
    // Find the activation
    const activation = await db.licenseActivation.findUnique({
      where: { activationKey: licenseInfo.activationKey },
      include: {
        license: true
      }
    })

    if (!activation || !activation.isActive) {
      return { valid: false, error: 'Activation not found or inactive' }
    }

    // Verify the license key matches
    if (activation.license.licenseKey !== licenseInfo.licenseKey) {
      return { valid: false, error: 'License key mismatch' }
    }

    // Check license status
    if (activation.license.status !== 'active') {
      return { valid: false, error: `License is ${activation.license.status}` }
    }

    // Check expiration
    if (activation.license.expiresAt && new Date() > new Date(activation.license.expiresAt)) {
      // Update license status to expired
      await db.license.update({
        where: { id: activation.license.id },
        data: { status: 'expired' }
      })
      
      return { valid: false, error: 'License has expired' }
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

    return { 
      valid: true, 
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
    }

  } catch (error) {
    console.error('License verification error:', error)
    return { valid: false, error: 'Failed to verify license' }
  }
}

// Main middleware function
export async function licenseMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Skip license check for certain paths
  const skipPaths = [
    '/login',
    '/api/auth',
    '/api/license/activate',
    '/api/license/check',
    '/api/license/deactivate',
    '/api/licenses',
    '/api/licenses/generate',
    '/api/licenses/hardware-binding',
    '/static',
    '/_next',
    '/favicon.ico'
  ]

  const url = new URL(request.url)
  const pathname = url.pathname

  // Skip if path is in skip list
  if (skipPaths.some(path => pathname.startsWith(path))) {
    return null
  }

  // Get license info from headers
  const licenseInfo = getLicenseInfoFromRequest(request)
  
  if (!licenseInfo) {
    // No license info provided, try to use demo license for development
    try {
      // Check if there's a demo license in the database
      const { db } = await import('@/lib/db')
      const demoActivation = await db.licenseActivation.findFirst({
        where: { 
          OR: [
            { activationKey: 'DEMO-ACTIVATION-KEY-12345' },
            { domain: 'localhost' }
          ]
        },
        include: {
          license: true
        }
      })

      if (demoActivation && demoActivation.license && demoActivation.license.status === 'active') {
        // Use demo license - just return null to continue with the request
        return null
      }
    } catch (error) {
      console.error('Error checking demo license:', error)
    }
    
    // No demo license found, redirect to activation
    if (pathname !== '/activate') {
      return NextResponse.redirect(new URL('/activate', request.url))
    }
    return null
  }

  // Verify the license
  const verification = await verifyLicenseFromDB(licenseInfo)
  
  if (!verification.valid) {
    // License verification failed, redirect to activation
    if (pathname !== '/activate') {
      return NextResponse.redirect(new URL('/activate', request.url))
    }
    return null
  }

  // License is valid, continue with the request
  // Just return null to continue with the original handler
  return null
}

// Higher-order function for route protection
export function withLicenseProtection(handler: (request: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    // Apply license middleware
    const middlewareResult = await licenseMiddleware(request)
    
    // If middleware returns a response (redirect), return it
    if (middlewareResult) {
      return middlewareResult
    }

    // If middleware returns null, continue with the original handler
    return handler(request, context)
  }
}

// Function to check license status for API routes
export async function checkLicenseStatus(request: NextRequest): Promise<{ valid: boolean; license?: any; error?: string }> {
  const licenseInfo = getLicenseInfoFromRequest(request)
  
  if (!licenseInfo) {
    return { valid: false, error: 'No license information provided' }
  }

  return await verifyLicenseFromDB(licenseInfo)
}

// Function to add license headers to response
export function addLicenseHeaders(response: NextResponse, license: any): NextResponse {
  response.headers.set('x-license-valid', 'true')
  response.headers.set('x-license-type', license.type)
  response.headers.set('x-license-client', license.clientName)
  response.headers.set('x-license-expires', license.expiresAt || 'never')
  
  return response
}