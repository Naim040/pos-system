import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || 'all'
    const severity = searchParams.get('severity') || 'all'
    const isResolved = searchParams.get('isResolved')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (type !== 'all') {
      where.type = type
    }

    if (severity !== 'all') {
      where.severity = severity
    }

    if (isResolved !== null && isResolved !== 'all') {
      where.isResolved = isResolved === 'true'
    }

    const [alerts, total] = await Promise.all([
      db.inventoryAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              imageUrl: true
            }
          },
          inventory: {
            select: {
              quantity: true,
              minStock: true,
              maxStock: true,
              location: true
            }
          }
        }
      }),
      db.inventoryAlert.count({ where })
    ])

    return NextResponse.json({
      alerts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching inventory alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, type, severity, message } = body

    // Get inventory for the product
    const inventory = await db.inventory.findUnique({
      where: { productId }
    })

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found for this product' },
        { status: 404 }
      )
    }

    const alert = await db.inventoryAlert.create({
      data: {
        productId,
        inventoryId: inventory.id,
        type,
        severity,
        message
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            imageUrl: true
          }
        },
        inventory: {
          select: {
            quantity: true,
            minStock: true,
            maxStock: true,
            location: true
          }
        }
      }
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory alert:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory alert' },
      { status: 500 }
    )
  }
}