import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { domainManager } from '@/lib/domainManager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domainId } = body

    if (!domainId) {
      return NextResponse.json(
        { error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    // Get domain details
    const domain = await db.tenantDomain.findUnique({
      where: { id: domainId },
      include: {
        tenant: true
      }
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    if (domain.isVerified) {
      return NextResponse.json({
        verified: true,
        message: 'Domain is already verified'
      })
    }

    // Verify domain using domain manager
    const verified = await domainManager.verifyDomain(domainId)

    if (verified) {
      // Update tenant custom domain flag
      await db.tenant.update({
        where: { id: domain.tenantId },
        data: { customDomain: true }
      })

      return NextResponse.json({
        verified: true,
        message: 'Domain verified successfully',
        domain: {
          id: domain.id,
          domain: domain.domain,
          isPrimary: domain.isPrimary,
          sslEnabled: domain.sslEnabled
        }
      })
    } else {
      return NextResponse.json({
        verified: false,
        message: 'Domain verification failed. Please check your DNS settings.',
        dnsInstructions: {
          type: 'TXT',
          name: domain.domain,
          value: domain.dnsRecord,
          ttl: 300
        }
      })
    }
  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify domain' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domainId')

    if (!domainId) {
      return NextResponse.json(
        { error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    const domain = await db.tenantDomain.findUnique({
      where: { id: domainId },
      include: {
        tenant: {
          select: { name: true, email: true }
        }
      }
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      domain,
      verificationStatus: {
        isVerified: domain.isVerified,
        verifiedAt: domain.verifiedAt,
        dnsRecord: domain.dnsRecord,
        sslEnabled: domain.sslEnabled
      }
    })
  } catch (error) {
    console.error('Error fetching domain verification status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domain verification status' },
      { status: 500 }
    )
  }
}