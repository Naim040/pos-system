import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const supplierId = searchParams.get('supplierId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status !== 'all') {
      where.status = status
    }

    if (supplierId) {
      where.supplierId = supplierId
    }

    const [purchaseOrders, total] = await Promise.all([
      db.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true
                }
              }
            }
          }
        }
      }),
      db.purchaseOrder.count({ where })
    ])

    return NextResponse.json({
      purchaseOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      supplierId,
      expectedDate,
      notes,
      items
    } = body

    // Generate unique order number
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Calculate totals
    let subtotal = 0
    const processedItems = items.map((item: any) => {
      const totalPrice = item.quantity * item.unitPrice
      subtotal += totalPrice
      return {
        ...item,
        totalPrice
      }
    })

    const tax = subtotal * 0.08 // 8% tax
    const shipping = 0 // Can be calculated or provided
    const total = subtotal + tax + shipping

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        supplierId,
        orderNumber,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal,
        tax,
        shipping,
        total,
        notes,
        createdBy: 'system', // Should be from authenticated user
        items: {
          create: processedItems
        }
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}