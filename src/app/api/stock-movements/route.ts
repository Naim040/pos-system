import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const productId = searchParams.get('productId')
    const type = searchParams.get('type') || 'all'
    const reason = searchParams.get('reason') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (productId) {
      where.productId = productId
    }

    if (type !== 'all') {
      where.type = type
    }

    if (reason !== 'all') {
      where.reason = reason
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [movements, total] = await Promise.all([
      db.stockMovement.findMany({
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
              location: true,
              aisle: true,
              shelf: true,
              bin: true
            }
          },
          purchaseOrder: {
            select: {
              id: true,
              orderNumber: true,
              status: true
            }
          }
        }
      }),
      db.stockMovement.count({ where })
    ])

    return NextResponse.json({
      movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      type,
      quantity,
      reason,
      referenceId,
      notes,
      location
    } = body

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

    // Validate quantity
    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if there's enough stock for outgoing movements
    if (type === 'out' && inventory.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock for this movement' },
        { status: 400 }
      )
    }

    // Update inventory quantity
    const newQuantity = type === 'in' ? 
      inventory.quantity + quantity : 
      inventory.quantity - quantity

    await db.inventory.update({
      where: { productId },
      data: { quantity: newQuantity }
    })

    // Create stock movement record
    const movement = await db.stockMovement.create({
      data: {
        productId,
        inventoryId: inventory.id,
        type,
        quantity,
        reason,
        referenceId,
        notes,
        location: location || inventory.location
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
            location: true,
            aisle: true,
            shelf: true,
            bin: true
          }
        },
        purchaseOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true
          }
        }
      }
    })

    // Check for inventory alerts after the movement
    await checkInventoryAlerts(productId)

    return NextResponse.json(movement, { status: 201 })
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return NextResponse.json(
      { error: 'Failed to create stock movement' },
      { status: 500 }
    )
  }
}

async function checkInventoryAlerts(productId: string) {
  const inventory = await db.inventory.findUnique({
    where: { productId },
    include: {
      product: true
    }
  })

  if (!inventory) return

  // Check for low stock
  if (inventory.quantity <= inventory.minStock) {
    const severity = inventory.quantity === 0 ? 'critical' : 
                    inventory.quantity <= inventory.minStock / 2 ? 'high' : 'medium'
    
    // Check if alert already exists and is not resolved
    const existingAlert = await db.inventoryAlert.findFirst({
      where: {
        productId,
        type: 'low_stock',
        isResolved: false
      }
    })

    if (!existingAlert) {
      await db.inventoryAlert.create({
        data: {
          productId,
          inventoryId: inventory.id,
          type: 'low_stock',
          severity,
          message: `Low stock alert: ${inventory.product.name} has ${inventory.quantity} units remaining (min: ${inventory.minStock})`
        }
      })
    }
  }

  // Check for overstock
  if (inventory.maxStock && inventory.quantity >= inventory.maxStock) {
    const existingAlert = await db.inventoryAlert.findFirst({
      where: {
        productId,
        type: 'overstock',
        isResolved: false
      }
    })

    if (!existingAlert) {
      await db.inventoryAlert.create({
        data: {
          productId,
          inventoryId: inventory.id,
          type: 'overstock',
          severity: 'medium',
          message: `Overstock alert: ${inventory.product.name} has ${inventory.quantity} units (max: ${inventory.maxStock})`
        }
      })
    }
  }

  // Check for out of stock
  if (inventory.quantity === 0) {
    const existingAlert = await db.inventoryAlert.findFirst({
      where: {
        productId,
        type: 'out_of_stock',
        isResolved: false
      }
    })

    if (!existingAlert) {
      await db.inventoryAlert.create({
        data: {
          productId,
          inventoryId: inventory.id,
          type: 'out_of_stock',
          severity: 'critical',
          message: `Out of stock: ${inventory.product.name} is completely out of stock`
        }
      })
    }
  }

  // Check for expiring products
  if (inventory.expiryDate) {
    const daysUntilExpiry = Math.ceil(
      (new Date(inventory.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilExpiry <= 30) {
      const existingAlert = await db.inventoryAlert.findFirst({
        where: {
          productId,
          type: 'expiring',
          isResolved: false
        }
      })

      if (!existingAlert) {
        const severity = daysUntilExpiry <= 7 ? 'critical' : 'high'
        
        await db.inventoryAlert.create({
          data: {
            productId,
            inventoryId: inventory.id,
            type: 'expiring',
            severity,
            message: `Expiring soon: ${inventory.product.name} expires in ${daysUntilExpiry} days`
          }
        })
      }
    }
  }
}