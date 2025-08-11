import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transfer = await db.stockTransfer.findUnique({
      where: { id: params.id },
      include: {
        fromStore: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        toStore: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true
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

    if (!transfer) {
      return NextResponse.json(
        { error: 'Stock transfer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transfer)
  } catch (error) {
    console.error('Error fetching stock transfer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock transfer' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const transfer = await db.stockTransfer.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!transfer) {
      return NextResponse.json(
        { error: 'Stock transfer not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['approved', 'cancelled'],
      'approved': ['in_transit', 'cancelled'],
      'in_transit': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    }

    if (!validTransitions[transfer.status as keyof typeof validTransitions].includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${transfer.status} to ${status}` },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    // Handle status-specific updates
    if (status === 'approved') {
      updateData.approvedBy = 'system' // In real app, get from authenticated user
    } else if (status === 'completed') {
      updateData.completedDate = new Date()
      
      // Create stock movements for completed transfer
      for (const item of transfer.items) {
        // Remove stock from source store
        await db.stockMovement.create({
          data: {
            productId: item.productId,
            inventoryId: (await db.inventory.findFirst({
              where: {
                productId: item.productId,
                storeId: transfer.fromStoreId
              }
            }))!.id,
            storeId: transfer.fromStoreId,
            type: 'out',
            quantity: item.quantity,
            reason: 'transfer_out',
            referenceId: transfer.id,
            notes: `Stock transfer to ${transfer.toStoreId}`
          }
        })

        // Add stock to destination store
        await db.stockMovement.create({
          data: {
            productId: item.productId,
            inventoryId: (await db.inventory.findFirst({
              where: {
                productId: item.productId,
                storeId: transfer.toStoreId
              }
            }))!.id,
            storeId: transfer.toStoreId,
            type: 'in',
            quantity: item.quantity,
            reason: 'transfer_in',
            referenceId: transfer.id,
            notes: `Stock transfer from ${transfer.fromStoreId}`
          }
        })

        // Update transferred quantity
        await db.stockTransferItem.update({
          where: { id: item.id },
          data: { transferredQuantity: item.quantity }
        })
      }
    }

    const updatedTransfer = await db.stockTransfer.update({
      where: { id: params.id },
      data: updateData,
      include: {
        fromStore: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        toStore: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedTransfer)
  } catch (error) {
    console.error('Error updating stock transfer:', error)
    return NextResponse.json(
      { error: 'Failed to update stock transfer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transfer = await db.stockTransfer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            items: true,
            stockMovements: true
          }
        }
      }
    })

    if (!transfer) {
      return NextResponse.json(
        { error: 'Stock transfer not found' },
        { status: 404 }
      )
    }

    // Cannot delete transfers that have stock movements
    if (transfer._count.stockMovements > 0) {
      return NextResponse.json(
        { error: 'Cannot delete transfer with stock movements' },
        { status: 400 }
      )
    }

    // Delete transfer items first
    await db.stockTransferItem.deleteMany({
      where: { transferId: params.id }
    })

    // Delete transfer
    await db.stockTransfer.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Stock transfer deleted successfully' })
  } catch (error) {
    console.error('Error deleting stock transfer:', error)
    return NextResponse.json(
      { error: 'Failed to delete stock transfer' },
      { status: 500 }
    )
  }
}