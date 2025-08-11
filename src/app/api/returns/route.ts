import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to generate return number
function generateReturnNumber(): string {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `RET-${timestamp}-${random}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const storeId = searchParams.get('storeId')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (storeId) {
      where.storeId = storeId
    }
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (startDate && endDate) {
      where.returnDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Get returns with related data
    const [returns, total] = await Promise.all([
      db.productReturn.findMany({
        where,
        include: {
          sale: {
            include: {
              customer: true,
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          customer: true,
          store: {
            select: { id: true, name: true, code: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          },
          returnItems: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true }
              },
              variation: {
                select: { id: true, sku: true }
              },
              saleItem: {
                select: { id: true, unitPrice: true, quantity: true }
              }
            }
          },
          returnRefunds: true,
          _count: {
            select: { returnItems: true }
          }
        },
        orderBy: { returnDate: 'desc' },
        skip,
        take: limit
      }),
      db.productReturn.count({ where })
    ])

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching returns:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch returns',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      saleId,
      returnItems,
      refundType,
      restockItems,
      notes,
      storeId,
      userId
    } = body

    // Validate required fields
    if (!saleId || !returnItems || !returnItems.length || !storeId || !userId) {
      return NextResponse.json(
        { error: 'Sale ID, return items, store ID, and user ID are required' },
        { status: 400 }
      )
    }

    // Get the original sale
    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true,
        saleItems: {
          include: {
            product: true,
            variation: true
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Calculate total return amount
    let totalAmount = 0
    let taxAmount = 0

    // Validate return items and calculate totals
    for (const returnItem of returnItems) {
      const saleItem = sale.saleItems.find(item => item.id === returnItem.saleItemId)
      
      if (!saleItem) {
        return NextResponse.json(
          { error: `Sale item ${returnItem.saleItemId} not found in original sale` },
          { status: 404 }
        )
      }

      if (returnItem.quantity > saleItem.quantity) {
        return NextResponse.json(
          { error: `Return quantity cannot exceed original quantity for item ${saleItem.product.name}` },
          { status: 400 }
        )
      }

      const itemTotal = returnItem.quantity * saleItem.unitPrice
      totalAmount += itemTotal
      
      // Calculate tax (simplified - you might want to use the original tax rate)
      const taxRate = 0.1 // 10% tax rate - adjust as needed
      taxAmount += itemTotal * taxRate
    }

    // Generate return number
    const returnNumber = generateReturnNumber()

    // Create the return record
    const newReturn = await db.productReturn.create({
      data: {
        returnNumber,
        saleId,
        customerId: sale.customerId,
        storeId,
        userId,
        totalAmount,
        taxAmount,
        refundAmount: totalAmount + taxAmount,
        refundType,
        restockItems: restockItems !== false, // Default to true
        notes,
        status: 'pending'
      },
      include: {
        sale: {
          include: {
            customer: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        customer: true,
        store: {
          select: { id: true, name: true, code: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Create return items
    for (const returnItem of returnItems) {
      const saleItem = sale.saleItems.find(item => item.id === returnItem.saleItemId)
      
      await db.returnItem.create({
        data: {
          returnId: newReturn.id,
          saleItemId: returnItem.saleItemId,
          productId: saleItem.productId,
          variationId: saleItem.variationId,
          quantity: returnItem.quantity,
          unitPrice: saleItem.unitPrice,
          totalPrice: returnItem.quantity * saleItem.unitPrice,
          returnReason: returnItem.returnReason,
          condition: returnItem.condition || 'good',
          restock: returnItem.restock !== false, // Default to true
          notes: returnItem.notes
        }
      })

      // Restock items if enabled
      if (restockItems !== false && returnItem.restock !== false) {
        // Find inventory record
        const inventory = await db.inventory.findUnique({
          where: {
            productId_storeId: {
              productId: saleItem.productId,
              storeId: storeId
            }
          }
        })

        if (inventory) {
          // Update inventory quantity
          await db.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity + returnItem.quantity,
              updatedAt: new Date()
            }
          })

          // Create stock movement record
          await db.stockMovement.create({
            data: {
              productId: saleItem.productId,
              variationId: saleItem.variationId,
              inventoryId: inventory.id,
              storeId: storeId,
              type: 'in',
              quantity: returnItem.quantity,
              reason: 'return',
              referenceId: newReturn.id,
              notes: `Return of ${returnItem.quantity} units - ${returnItem.returnReason || 'No reason provided'}`
            }
          })
        }
      }
    }

    // Update customer balance if it's an adjustment
    if (refundType === 'adjustment' && sale.customerId) {
      await db.customer.update({
        where: { id: sale.customerId },
        data: {
          dueBalance: {
            decrement: totalAmount + taxAmount
          },
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      return: newReturn,
      message: 'Return created successfully'
    })

  } catch (error) {
    console.error('Error creating return:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create return',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}