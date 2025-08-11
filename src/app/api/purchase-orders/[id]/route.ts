import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: {
                inventory: true
              }
            }
          }
        },
        stockMovements: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(purchaseOrder)
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase order' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      status,
      expectedDate,
      receivedDate,
      notes,
      items
    } = body

    // If status is being changed to 'received', process inventory updates
    if (status === 'received') {
      await processPurchaseOrderReceipt(params.id, items)
    }

    // Recalculate totals if items are updated
    let subtotal = 0
    let processedItems = []
    
    if (items) {
      processedItems = items.map((item: any) => {
        const totalPrice = item.quantity * item.unitPrice
        subtotal += totalPrice
        return {
          ...item,
          totalPrice
        }
      })
    }

    const tax = subtotal * 0.08
    const shipping = 0
    const total = subtotal + tax + shipping

    const updateData: any = {
      status,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      receivedDate: receivedDate ? new Date(receivedDate) : null,
      notes,
      subtotal,
      tax,
      shipping,
      total
    }

    // Update purchase order
    const purchaseOrder = await db.purchaseOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: {
                inventory: true
              }
            }
          }
        }
      }
    })

    // Update items if provided
    if (items) {
      // Delete existing items
      await db.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: params.id }
      })

      // Create new items
      await db.purchaseOrderItem.createMany({
        data: processedItems.map((item: any) => ({
          purchaseOrderId: params.id,
          productId: item.productId,
          quantity: item.quantity,
          receivedQuantity: item.receivedQuantity || 0,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes
        }))
      })
    }

    return NextResponse.json(purchaseOrder)
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: params.id },
      select: { status: true }
    })

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Cannot delete purchase orders that are already received or confirmed
    if (['received', 'confirmed'].includes(purchaseOrder.status)) {
      return NextResponse.json(
        { error: 'Cannot delete purchase order that is already processed' },
        { status: 400 }
      )
    }

    await db.purchaseOrder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Purchase order deleted successfully' })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}

async function processPurchaseOrderReceipt(purchaseOrderId: string, items: any[]) {
  for (const item of items) {
    const { productId, receivedQuantity, unitPrice } = item
    
    if (receivedQuantity > 0) {
      // Update inventory
      const inventory = await db.inventory.findUnique({
        where: { productId }
      })

      if (inventory) {
        await db.inventory.update({
          where: { productId },
          data: {
            quantity: inventory.quantity + receivedQuantity,
            costPrice: unitPrice
          }
        })
      } else {
        await db.inventory.create({
          data: {
            productId,
            quantity: receivedQuantity,
            costPrice: unitPrice
          }
        })
      }

      // Create stock movement record
      await db.stockMovement.create({
        data: {
          productId,
          inventoryId: inventory?.id || productId,
          type: 'in',
          quantity: receivedQuantity,
          reason: 'purchase',
          referenceId: purchaseOrderId,
          notes: `Received from purchase order`
        }
      })

      // Check for inventory alerts
      await checkInventoryAlerts(productId)
    }
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

  // Check for overstock
  if (inventory.maxStock && inventory.quantity >= inventory.maxStock) {
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