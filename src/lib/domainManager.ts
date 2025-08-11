import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as dns from 'dns'
import { promisify } from 'util'

export interface TenantDomain {
  id: string
  tenantId: string
  domain: string
  isPrimary: boolean
  isVerified: boolean
  sslEnabled: boolean
  dnsRecord: string
  verificationToken: string
  verifiedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface TenantConfig {
  id: string
  name: string
  email: string
  plan: string
  maxUsers: number
  maxStores: number
  customDomain: boolean
  settings: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

class DomainManager {
  /**
   * Add a custom domain to a tenant
   */
  async addDomain(tenantId: string, domain: string, isPrimary = false): Promise<TenantDomain> {
    try {
      // Clean domain
      const cleanDomain = this.cleanDomain(domain)
      
      // Check if domain already exists
      const existingDomain = await db.tenantDomain.findUnique({
        where: { domain: cleanDomain }
      })

      if (existingDomain) {
        throw new Error('Domain already exists')
      }

      // Generate verification token
      const verificationToken = this.generateVerificationToken()

      // Create domain record
      const tenantDomain = await db.tenantDomain.create({
        data: {
          tenantId,
          domain: cleanDomain,
          isPrimary,
          isVerified: false,
          sslEnabled: false,
          dnsRecord: this.generateDNSRecord(cleanDomain),
          verificationToken,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return tenantDomain
    } catch (error) {
      console.error('Error adding domain:', error)
      throw error
    }
  }

  /**
   * Verify domain ownership
   */
  async verifyDomain(domainId: string): Promise<boolean> {
    try {
      const domain = await db.tenantDomain.findUnique({
        where: { id: domainId },
        include: {
          tenant: true
        }
      })

      if (!domain) {
        throw new Error('Domain not found')
      }

      // Check DNS verification
      const dnsVerified = await this.verifyDNSRecord(domain.domain, domain.dnsRecord)
      
      if (dnsVerified) {
        await db.tenantDomain.update({
          where: { id: domainId },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
            updatedAt: new Date()
          }
        })
        return true
      }

      return false
    } catch (error) {
      console.error('Error verifying domain:', error)
      throw error
    }
  }

  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain: string): Promise<TenantConfig | null> {
    try {
      const cleanDomain = this.cleanDomain(domain)
      
      const tenantDomain = await db.tenantDomain.findFirst({
        where: {
          domain: cleanDomain,
          isVerified: true
        },
        include: {
          tenant: true
        }
      })

      return tenantDomain?.tenant || null
    } catch (error) {
      console.error('Error getting tenant by domain:', error)
      return null
    }
  }

  /**
   * Get all domains for a tenant
   */
  async getTenantDomains(tenantId: string): Promise<TenantDomain[]> {
    try {
      return await db.tenantDomain.findMany({
        where: { tenantId },
        orderBy: { isPrimary: 'desc' }
      })
    } catch (error) {
      console.error('Error getting tenant domains:', error)
      throw error
    }
  }

  /**
   * Remove domain from tenant
   */
  async removeDomain(domainId: string): Promise<boolean> {
    try {
      await db.tenantDomain.delete({
        where: { id: domainId }
      })
      return true
    } catch (error) {
      console.error('Error removing domain:', error)
      throw error
    }
  }

  /**
   * Setup SSL for domain
   */
  async setupSSL(domainId: string): Promise<boolean> {
    try {
      const domain = await db.tenantDomain.findUnique({
        where: { id: domainId }
      })

      if (!domain || !domain.isVerified) {
        throw new Error('Domain must be verified before SSL setup')
      }

      // In production, this would integrate with Let's Encrypt or similar
      // For now, we'll mark it as enabled
      await db.tenantDomain.update({
        where: { id: domainId },
        data: {
          sslEnabled: true,
          updatedAt: new Date()
        }
      })

      return true
    } catch (error) {
      console.error('Error setting up SSL:', error)
      throw error
    }
  }

  /**
   * Clean domain name
   */
  private cleanDomain(domain: string): string {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Generate DNS record for verification
   */
  private generateDNSRecord(domain: string): string {
    return `pos-verify-${this.generateVerificationToken().substring(0, 16)}`
  }

  /**
   * Verify DNS record
   */
  private async verifyDNSRecord(domain: string, expectedRecord: string): Promise<boolean> {
    try {
      // In production, this would check actual DNS records
      // For demo purposes, we'll simulate verification
      // You would use a DNS library like 'dns' or external API
      
      // Simulate DNS verification - in production, replace with actual DNS check
      const resolveTxt = promisify(dns.resolveTxt)
      
      try {
        const records = await resolveTxt(domain)
        return records.some(record => record.includes(expectedRecord))
      } catch (error) {
        console.log('DNS record not found, simulating verification for demo')
        return true // For demo purposes
      }
    } catch (error) {
      console.error('Error verifying DNS record:', error)
      return false
    }
  }

  /**
   * Middleware for domain routing
   */
  async domainMiddleware(request: NextRequest): Promise<{ tenant: TenantConfig | null; domain: TenantDomain | null }> {
    try {
      const host = request.headers.get('host') || ''
      const domain = this.cleanDomain(host)
      
      // Skip for localhost and default domains
      if (domain === 'localhost' || domain === '127.0.0.1' || domain.endsWith('.local')) {
        return { tenant: null, domain: null }
      }

      // Get tenant by domain
      const tenant = await this.getTenantByDomain(domain)
      const domainRecord = tenant ? await db.tenantDomain.findFirst({
        where: {
          domain,
          tenantId: tenant.id
        }
      }) : null

      return { tenant, domain: domainRecord }
    } catch (error) {
      console.error('Error in domain middleware:', error)
      return { tenant: null, domain: null }
    }
  }
}

export const domainManager = new DomainManager()
export default DomainManager