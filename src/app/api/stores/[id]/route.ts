import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = await db.store.findUnique({
      where: { id: params.id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        inventory: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                price: true
              }
            }
          }
        }
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error fetching store:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const {
      name,
      code,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      timezone,
      currency,
      isActive,
      isHeadquarters,
      openingHours,
      notes,
      managerId
    } = body

    // Check if store code already exists (excluding current store)
    if (code) {
      const existingStore = await db.store.findFirst({
        where: {
          code,
          NOT: { id: params.id }
        }
      })

      if (existingStore) {
        return NextResponse.json(
          { error: 'Store code already exists' },
          { status: 400 }
        )
      }
    }

    // If this is set as headquarters, remove headquarters flag from other stores
    if (isHeadquarters) {
      await db.store.updateMany({
        where: {
          isHeadquarters: true,
          NOT: { id: params.id }
        },
        data: { isHeadquarters: false }
      })
    }

    const store = await db.store.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zipCode !== undefined && { zipCode }),
        ...(country !== undefined && { country }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(timezone && { timezone }),
        ...(currency && { currency }),
        ...(isActive !== undefined && { isActive }),
        ...(isHeadquarters !== undefined && { isHeadquarters }),
        ...(openingHours !== undefined && { openingHours }),
        ...(notes !== undefined && { notes }),
        ...(managerId !== undefined && { managerId })
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error updating store:', error)
    return NextResponse.json(
      { error: 'Failed to update store' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if store has related records
    const relatedRecords = await db.store.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            inventory: true,
            sales: true,
            purchaseOrders: true,
            fromTransfers: true,
            toTransfers: true
          }
        }
      }
    })

    if (!relatedRecords) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    const hasRelatedRecords = 
      relatedRecords._count.users > 0 ||
      relatedRecords._count.inventory > 0 ||
      relatedRecords._count.sales > 0 ||
      relatedRecords._count.purchaseOrders > 0 ||
      relatedRecords._count.fromTransfers > 0 ||
      relatedRecords._count.toTransfers > 0

    if (hasRelatedRecords) {
      return NextResponse.json(
        { error: 'Cannot delete store with related records' },
        { status: 400 }
      )
    }

    await db.store.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Store deleted successfully' })
  } catch (error) {
    console.error('Error deleting store:', error)
    return NextResponse.json(
      { error: 'Failed to delete store' },
      { status: 500 }
    )
  }
}