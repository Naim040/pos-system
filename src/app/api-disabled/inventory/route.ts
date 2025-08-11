import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const lowStock = searchParams.get('lowStock') === 'true'
    const outOfStock = searchParams.get('outOfStock') === 'true'
    const expiring = searchParams.get('expiring') === 'true'
    const location = searchParams.get('location') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    if (lowStock) {
      where.quantity = {
        lte: db.inventory.fields.minStock
      }
    }

    if (outOfStock) {
      where.quantity = 0
    }

    if (expiring) {
      where.expiryDate = {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive'
      }
    }

    const [inventory, total] = await Promise.all([
      db.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { quantity: 'asc' },
          { product: { name: 'asc' } }
        ],
        include: {
          product: {
            include: {
              category: true
            }
          },
          stockMovements: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              type: true,
              quantity: true,
              reason: true,
              createdAt: true
            }
          },
          inventoryAlerts: {
            where: { isResolved: false },
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        }
      }),
      db.inventory.count({ where })
    ])

    return NextResponse.json({
      inventory,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      quantity,
      minStock,
      maxStock,
      reorderPoint,
      costPrice,
      location,
      aisle,
      shelf,
      bin,
      batchNumber,
      expiryDate,
      isActive
    } = body

    // Check if inventory already exists for this product
    const existingInventory = await db.inventory.findUnique({
      where: { productId }
    })

    if (existingInventory) {
      return NextResponse.json(
        { error: 'Inventory already exists for this product' },
        { status: 400 }
      )
    }

    const inventory = await db.inventory.create({
      data: {
        productId,
        quantity: quantity || 0,
        minStock: minStock || 0,
        maxStock,
        reorderPoint: reorderPoint || 0,
        costPrice: costPrice || 0,
        location,
        aisle,
        shelf,
        bin,
        batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: isActive ?? true
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        inventoryAlerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    })

    // Check for initial inventory alerts
    await checkInventoryAlerts(productId)

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory' },
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

  // Check for out of stock
  if (inventory.quantity === 0) {
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

  // Check for expiring products
  if (inventory.expiryDate) {
    const daysUntilExpiry = Math.ceil(
      (new Date(inventory.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilExpiry <= 30) {
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