import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface FranchiseInfo {
  franchiseId: string
  franchiseEmail: string
  franchiseName: string
  status: string
  role: string
  permissions?: string
}

// Helper function to get franchise info from request headers
function getFranchiseInfoFromRequest(request: NextRequest): FranchiseInfo | null {
  const franchiseId = request.headers.get('x-franchise-id')
  const franchiseEmail = request.headers.get('x-franchise-email')
  
  if (!franchiseId || !franchiseEmail) {
    return null
  }

  return {
    franchiseId,
    franchiseEmail,
    franchiseName: '',
    status: '',
    role: ''
  }
}

// Helper function to verify franchise from database
async function verifyFranchiseFromDB(franchiseInfo: FranchiseInfo): Promise<{ valid: boolean; franchise?: any; error?: string }> {
  try {
    // Find the franchise
    const franchise = await db.franchise.findUnique({
      where: { id: franchiseInfo.franchiseId },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    })

    if (!franchise) {
      return { valid: false, error: 'Franchise not found' }
    }

    // Verify franchise email matches
    if (franchise.email !== franchiseInfo.franchiseEmail) {
      return { valid: false, error: 'Franchise email mismatch' }
    }

    // Check franchise status
    if (franchise.status === 'pending') {
      return { valid: false, error: 'Franchise application is pending approval' }
    }

    if (franchise.status === 'rejected') {
      return { valid: false, error: 'Franchise application was rejected' }
    }

    if (franchise.status === 'suspended') {
      return { valid: false, error: 'Franchise account is suspended' }
    }

    if (franchise.isBlocked) {
      return { valid: false, error: 'Franchise account is blocked due to outstanding payments' }
    }

    // Find the franchise user to get role and permissions
    const franchiseUser = franchise.users.find(u => u.user.email === franchiseInfo.franchiseEmail)
    if (!franchiseUser || !franchiseUser.isActive) {
      return { valid: false, error: 'Franchise user not found or inactive' }
    }

    return { 
      valid: true, 
      franchise: {
        id: franchise.id,
        name: franchise.name,
        email: franchise.email,
        status: franchise.status,
        role: franchiseUser.role,
        permissions: franchiseUser.permissions,
        maxClients: franchise.maxClients,
        currentClients: franchise.currentClients,
        outstandingBalance: franchise.outstandingBalance,
        isBlocked: franchise.isBlocked
      }
    }

  } catch (error) {
    console.error('Franchise verification error:', error)
    return { valid: false, error: 'Failed to verify franchise' }
  }
}

// Main middleware function for franchise routes
export async function franchiseMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Skip franchise check for certain paths
  const skipPaths = [
    '/login',
    '/api/auth',
    '/api/franchise/register',
    '/api/franchise/login',
    '/api/franchise/apply',
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

  // Get franchise info from headers
  const franchiseInfo = getFranchiseInfoFromRequest(request)
  
  if (!franchiseInfo) {
    // No franchise info provided, redirect to franchise login
    if (pathname.startsWith('/franchise') && pathname !== '/franchise/login') {
      return NextResponse.redirect(new URL('/franchise/login', request.url))
    }
    return null
  }

  // Verify the franchise
  const verification = await verifyFranchiseFromDB(franchiseInfo)
  
  if (!verification.valid) {
    // Franchise verification failed, redirect to franchise login
    if (pathname.startsWith('/franchise') && pathname !== '/franchise/login') {
      return NextResponse.redirect(new URL('/franchise/login', request.url))
    }
    return null
  }

  // Franchise is valid, continue with the request
  // Add franchise info to request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-franchise-verified', 'true')
  requestHeaders.set('x-franchise-name', verification.franchise.name)
  requestHeaders.set('x-franchise-status', verification.franchise.status)
  requestHeaders.set('x-franchise-role', verification.franchise.role)
  requestHeaders.set('x-franchise-max-clients', verification.franchise.maxClients.toString())
  requestHeaders.set('x-franchise-current-clients', verification.franchise.currentClients.toString())
  requestHeaders.set('x-franchise-outstanding-balance', verification.franchise.outstandingBalance.toString())

  if (verification.franchise.permissions) {
    requestHeaders.set('x-franchise-permissions', verification.franchise.permissions)
  }

  // Clone the request and update headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })

  return response
}

// Higher-order function for franchise route protection
export function withFranchiseProtection(handler: (request: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    // Apply franchise middleware
    const middlewareResult = await franchiseMiddleware(request)
    
    // If middleware returns a response (redirect), return it
    if (middlewareResult) {
      return middlewareResult
    }

    // If middleware returns null, continue with the original handler
    return handler(request, context)
  }
}

// Function to check franchise status for API routes
export async function checkFranchiseStatus(request: NextRequest): Promise<{ valid: boolean; franchise?: any; error?: string }> {
  const franchiseInfo = getFranchiseInfoFromRequest(request)
  
  if (!franchiseInfo) {
    return { valid: false, error: 'No franchise information provided' }
  }

  return await verifyFranchiseFromDB(franchiseInfo)
}

// Function to check franchise permissions
export function hasFranchisePermission(request: NextRequest, requiredPermission: string): boolean {
  const permissions = request.headers.get('x-franchise-permissions')
  const role = request.headers.get('x-franchise-role')
  
  if (!permissions || !role) {
    return false
  }

  try {
    const permissionsArray = JSON.parse(permissions)
    return permissionsArray.includes(requiredPermission) || role === 'admin'
  } catch {
    return false
  }
}

// Function to add franchise headers to response
export function addFranchiseHeaders(response: NextResponse, franchise: any): NextResponse {
  response.headers.set('x-franchise-valid', 'true')
  response.headers.set('x-franchise-name', franchise.name)
  response.headers.set('x-franchise-status', franchise.status)
  response.headers.set('x-franchise-role', franchise.role)
  
  return response
}