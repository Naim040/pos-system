import { NextRequest, NextResponse } from 'next/server'
import { checkLicenseStatus, addLicenseHeaders } from '@/lib/licenseMiddleware'

// Wrapper function for API routes that require license verification
export function withLicenseCheck(handler: (request: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    // Check license status
    const licenseCheck = await checkLicenseStatus(request)
    
    if (!licenseCheck.valid) {
      return NextResponse.json(
        { 
          error: 'License verification failed',
          details: licenseCheck.error || 'Invalid or expired license'
        },
        { status: 403 }
      )
    }

    // License is valid, proceed with the original handler
    const response = await handler(request, context)
    
    // Add license headers to response
    if (licenseCheck.license) {
      return addLicenseHeaders(response, licenseCheck.license)
    }
    
    return response
  }
}

// Example usage for protecting API routes:
/*
export const GET = withLicenseCheck(async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ data: 'Protected content' })
})
*/