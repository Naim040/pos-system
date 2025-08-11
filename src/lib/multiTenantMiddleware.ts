import { NextRequest, NextResponse } from 'next/server'
import { domainManager } from './domainManager'
import { db } from './db'

export interface TenantContext {
  tenant: {
    id: string
    name: string
    email: string
    plan: string
    maxUsers: number
    maxStores: number
    customDomain: boolean
    settings: any
    isActive: boolean
  }
  domain: {
    id: string
    domain: string
    isPrimary: boolean
    isVerified: boolean
    sslEnabled: boolean
  } | null
  isCustomDomain: boolean
}

export class MultiTenantMiddleware {
  /**
   * Main middleware function to handle tenant resolution
   */
  async handleRequest(request: NextRequest): Promise<{
    tenantContext: TenantContext | null
    response: NextResponse | null
  }> {
    try {
      const host = request.headers.get('host') || ''
      const url = new URL(request.url)

      // Skip for certain paths
      if (this.shouldSkip(url.pathname)) {
        return { tenantContext: null, response: null }
      }

      // Get tenant by domain
      const { tenant, domain } = await domainManager.domainMiddleware(request)

      if (!tenant || !tenant.isActive) {
        // For custom domains that don't exist, show a branded page
        if (this.isCustomDomain(host)) {
          return this.handleUnknownDomain(host)
        }

        // For localhost/default domains, continue without tenant context
        return { tenantContext: null, response: null }
      }

      // Check subscription status
      const subscriptionValid = await this.validateSubscription(tenant.id)
      if (!subscriptionValid) {
        return this.handleInactiveSubscription(tenant)
      }

      // Create tenant context
      const tenantContext: TenantContext = {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          plan: tenant.plan,
          maxUsers: tenant.maxUsers,
          maxStores: tenant.maxStores,
          customDomain: tenant.customDomain,
          settings: JSON.parse(tenant.settings || '{}'),
          isActive: tenant.isActive
        },
        domain: domain ? {
          id: domain.id,
          domain: domain.domain,
          isPrimary: domain.isPrimary,
          isVerified: domain.isVerified,
          sslEnabled: domain.sslEnabled
        } : null,
        isCustomDomain: this.isCustomDomain(host)
      }

      // Add tenant context to request headers for downstream use
      const modifiedRequest = this.addTenantContextToRequest(request, tenantContext)

      return { tenantContext, response: null }
    } catch (error) {
      console.error('Multi-tenant middleware error:', error)
      return { tenantContext: null, response: null }
    }
  }

  /**
   * Check if request should skip tenant resolution
   */
  private shouldSkip(pathname: string): boolean {
    const skipPaths = [
      '/api/auth',
      '/api/license',
      '/api/licenses',
      '/api/domains',
      '/api/tenants',
      '/api/health',
      '/_next',
      '/favicon.ico',
      '/login',
      '/unauthorized'
    ]

    return skipPaths.some(path => pathname.startsWith(path))
  }

  /**
   * Check if host is a custom domain
   */
  private isCustomDomain(host: string): boolean {
    const cleanHost = host.replace(/^www\./, '').toLowerCase()
    
    // List of default domains that don't require tenant resolution
    const defaultDomains = [
      'localhost',
      '127.0.0.1',
      'your-app-domain.com' // Replace with your actual domain
    ]

    return !defaultDomains.includes(cleanHost)
  }

  /**
   * Handle requests to unknown custom domains
   */
  private handleUnknownDomain(host: string): {
    tenantContext: null
    response: NextResponse
  } {
    const response = NextResponse.json(
      {
        error: 'Domain not configured',
        message: 'This domain is not configured for our POS system.',
        setupInstructions: {
          step1: 'Contact your administrator to set up this domain',
          step2: 'Or check if the domain has been properly verified'
        }
      },
      { status: 404 }
    )

    return { tenantContext: null, response }
  }

  /**
   * Validate tenant subscription
   */
  private async validateSubscription(tenantId: string): Promise<boolean> {
    try {
      const subscription = await db.subscription.findFirst({
        where: {
          tenantId,
          status: 'active',
          OR: [
            { currentPeriodEnd: null }, // Lifetime subscription
            { currentPeriodEnd: { gte: new Date() } } // Active subscription
          ]
        }
      })

      return !!subscription
    } catch (error) {
      console.error('Error validating subscription:', error)
      return false
    }
  }

  /**
   * Handle inactive subscription
   */
  private handleInactiveSubscription(tenant: any): {
    tenantContext: null
    response: NextResponse
  } {
    const response = NextResponse.json(
      {
        error: 'Subscription inactive',
        message: 'Your subscription is not active. Please renew your subscription to continue using the service.',
        tenant: {
          name: tenant.name,
          email: tenant.email
        }
      },
      { status: 403 }
    )

    return { tenantContext: null, response }
  }

  /**
   * Add tenant context to request headers
   */
  private addTenantContextToRequest(request: NextRequest, tenantContext: TenantContext): NextRequest {
    // Create a new request with tenant context headers
    const headers = new Headers(request.headers)
    
    headers.set('x-tenant-id', tenantContext.tenant.id)
    headers.set('x-tenant-name', tenantContext.tenant.name)
    headers.set('x-tenant-email', tenantContext.tenant.email)
    headers.set('x-tenant-plan', tenantContext.tenant.plan)
    headers.set('x-tenant-domain', tenantContext.domain?.domain || '')
    headers.set('x-is-custom-domain', tenantContext.isCustomDomain.toString())

    // Return modified request
    return new NextRequest(request.url, {
      method: request.method,
      headers,
      body: request.body,
      redirect: request.redirect
    })
  }

  /**
   * Extract tenant context from request
   */
  static extractTenantContext(request: NextRequest): TenantContext | null {
    try {
      const tenantId = request.headers.get('x-tenant-id')
      const tenantName = request.headers.get('x-tenant-name')
      const tenantEmail = request.headers.get('x-tenant-email')
      const tenantPlan = request.headers.get('x-tenant-plan')
      const tenantDomain = request.headers.get('x-tenant-domain')
      const isCustomDomain = request.headers.get('x-is-custom-domain') === 'true'

      if (!tenantId || !tenantName || !tenantEmail) {
        return null
      }

      return {
        tenant: {
          id: tenantId,
          name: tenantName,
          email: tenantEmail,
          plan: tenantPlan || 'basic',
          maxUsers: 5, // Default values
          maxStores: 1,
          customDomain: isCustomDomain,
          settings: {},
          isActive: true
        },
        domain: tenantDomain ? {
          id: 'temp',
          domain: tenantDomain,
          isPrimary: true,
          isVerified: true,
          sslEnabled: false
        } : null,
        isCustomDomain
      }
    } catch (error) {
      console.error('Error extracting tenant context:', error)
      return null
    }
  }
}

export const multiTenantMiddleware = new MultiTenantMiddleware()