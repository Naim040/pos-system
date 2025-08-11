import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {}

    // Get tenants with pagination
    const [tenants, total] = await Promise.all([
      db.tenant.findMany({
        where,
        include: {
          domains: {
            where: { isVerified: true },
            select: { domain: true, isPrimary: true }
          },
          users: {
            include: {
              user: {
                select: { email: true, name: true, role: true }
              }
            }
          },
          subscriptions: {
            where: { status: 'active' },
            orderBy: { currentPeriodStart: 'desc' },
            take: 1
          },
          _count: {
            select: {
              users: true,
              stores: true,
              domains: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.tenant.count({ where })
    ])

    return NextResponse.json({
      tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, plan = 'basic', maxUsers = 5, maxStores = 1, settings = {} } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if tenant with this email already exists
    const existingTenant = await db.tenant.findUnique({
      where: { email }
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant with this email already exists' },
        { status: 400 }
      )
    }

    // Create tenant
    const tenant = await db.tenant.create({
      data: {
        name,
        email,
        plan,
        maxUsers,
        maxStores,
        customDomain: false,
        settings: JSON.stringify(settings),
        isActive: true
      },
      include: {
        domains: true,
        users: true,
        subscriptions: true
      }
    })

    // Create default subscription (trial)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

    await db.subscription.create({
      data: {
        tenantId: tenant.id,
        plan,
        status: 'active',
        billingCycle: 'monthly',
        amount: 0, // Free trial
        currency: 'USD',
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndDate,
        trialEnd: trialEndDate,
        metadata: JSON.stringify({ trial: true })
      }
    })

    return NextResponse.json({
      tenant,
      message: 'Tenant created successfully with 14-day trial'
    })
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}