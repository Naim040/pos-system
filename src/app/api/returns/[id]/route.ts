import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const returnId = params.id

    const returnRecord = await db.productReturn.findUnique({
      where: { id: returnId },
      include: {
        sale: {
          include: {
            customer: true,
            user: {
              select: { id: true, name: true, email: true }
            },
            payments: true
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
              select: { id: true, name: true, sku: true, barcode: true, imageUrl: true }
            },
            variation: {
              select: { id: true, sku: true }
            },
            saleItem: {
              select: { id: true, unitPrice: true, quantity: true }
            }
          }
        },
        returnRefunds: {
          include: {
            processedByUser: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        stockMovements: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        }
      }
    })

    if (!returnRecord) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ return: returnRecord })

  } catch (error) {
    console.error('Error fetching return:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch return',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const returnId = params.id
    const body = await request.json()
    const {
      status,
      refundType,
      restockItems,
      notes,
      userId // User making the update
    } = body

    // Get the current return record
    const currentReturn = await db.productReturn.findUnique({
      where: { id: returnId },
      include: {
        returnItems: {
          include: {
            product: true,
            variation: true
          }
        },
        sale: {
          include: {
            customer: true
          }
        }
      }
    })

    if (!currentReturn) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      )
    }

    // Update the return record
    const updatedReturn = await db.productReturn.update({
      where: { id: returnId },
      data: {
        ...(status && { status }),
        ...(refundType && { refundType }),
        ...(restockItems !== undefined && { restockItems }),
        ...(notes !== undefined && { notes }),
        ...(status === 'approved' && {
          approvedBy: userId,
          approvedAt: new Date()
        }),
        ...(status === 'completed' && {
          processedBy: userId,
          processedAt: new Date()
        })
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
        },
        returnItems: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, barcode: true }
            },
            variation: {
              select: { id: true, sku: true }
            }
          }
        },
        returnRefunds: true
      }
    })

    // Handle restocking if status changed to approved and restocking is enabled
    if (status === 'approved' && restockItems) {
      for (const returnItem of currentReturn.returnItems) {
        if (returnItem.restock) {
          // Find inventory record
          const inventory = await db.inventory.findUnique({
            where: {
              productId_storeId: {
                productId: returnItem.productId,
                storeId: currentReturn.storeId
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
                productId: returnItem.productId,
                variationId: returnItem.variationId,
                inventoryId: inventory.id,
                storeId: currentReturn.storeId,
                type: 'in',
                quantity: returnItem.quantity,
                reason: 'return',
                referenceId: returnId,
                notes: `Restock of ${returnItem.quantity} units - ${returnItem.returnReason || 'No reason provided'}`
              }
            })
          }
        }
      }
    }

    // Handle customer balance adjustment for adjustment type refunds
    if (refundType === 'adjustment' && currentReturn.sale.customerId) {
      const adjustmentAmount = currentReturn.refundAmount
      
      if (status === 'completed') {
        // Apply the adjustment to customer balance
        await db.customer.update({
          where: { id: currentReturn.sale.customerId },
          data: {
            dueBalance: {
              decrement: adjustmentAmount
            },
            updatedAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      return: updatedReturn,
      message: 'Return updated successfully'
    })

  } catch (error) {
    console.error('Error updating return:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update return',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const returnId = params.id

    // Get the return record first
    const returnRecord = await db.productReturn.findUnique({
      where: { id: returnId },
      include: {
        returnItems: true,
        stockMovements: true,
        returnRefunds: true
      }
    })

    if (!returnRecord) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      )
    }

    // Check if return can be deleted (only pending returns can be deleted)
    if (returnRecord.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending returns can be deleted' },
        { status: 400 }
      )
    }

    // Reverse stock movements if items were restocked
    for (const stockMovement of returnRecord.stockMovements) {
      if (stockMovement.type === 'in') {
        const inventory = await db.inventory.findUnique({
          where: { id: stockMovement.inventoryId }
        })

        if (inventory) {
          await db.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: Math.max(0, inventory.quantity - stockMovement.quantity),
              updatedAt: new Date()
            }
          })
        }
      }
    }

    // Delete the return and all related records
    await db.productReturn.delete({
      where: { id: returnId }
    })

    return NextResponse.json({
      success: true,
      message: 'Return deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting return:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete return',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}