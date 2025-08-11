import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { domainManager } from '@/lib/domainManager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    const domains = await db.tenantDomain.findMany({
      where: { tenantId },
      include: {
        tenant: {
          select: { name: true, email: true }
        }
      },
      orderBy: { isPrimary: 'desc' }
    })

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, domain, isPrimary = false } = body

    if (!tenantId || !domain) {
      return NextResponse.json(
        { error: 'Tenant ID and domain are required' },
        { status: 400 }
      )
    }

    // Check if tenant exists
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if tenant can have custom domains
    if (!tenant.customDomain && tenant.plan === 'basic') {
      return NextResponse.json(
        { error: 'Custom domains require professional plan or higher' },
        { status: 400 }
      )
    }

    // Add domain using domain manager
    const tenantDomain = await domainManager.addDomain(tenantId, domain, isPrimary)

    return NextResponse.json({
      domain: tenantDomain,
      message: 'Domain added successfully. Please complete DNS verification.',
      dnsInstructions: {
        type: 'TXT',
        name: domain,
        value: tenantDomain.dnsRecord,
        ttl: 300
      }
    })
  } catch (error) {
    console.error('Error adding domain:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add domain' },
      { status: 500 }
    )
  }
}