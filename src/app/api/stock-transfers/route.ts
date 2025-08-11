import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const transfers = await db.stockTransfer.findMany({
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
      },
      orderBy: {
        transferDate: 'desc'
      }
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error('Error fetching stock transfers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock transfers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      fromStoreId,
      toStoreId,
      expectedDate,
      notes,
      items
    } = body

    // Validate required fields
    if (!fromStoreId || !toStoreId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if stores exist
    const fromStore = await db.store.findUnique({
      where: { id: fromStoreId }
    })

    const toStore = await db.store.findUnique({
      where: { id: toStoreId }
    })

    if (!fromStore || !toStore) {
      return NextResponse.json(
        { error: 'One or both stores not found' },
        { status: 404 }
      )
    }

    // Generate transfer number
    const transferNumber = `TRF-${Date.now()}`

    // Create stock transfer
    const transfer = await db.stockTransfer.create({
      data: {
        transferNumber,
        fromStoreId,
        toStoreId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        requestedBy: 'system', // In real app, get from authenticated user
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            notes: item.notes
          }))
        }
      },
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

    return NextResponse.json(transfer)
  } catch (error) {
    console.error('Error creating stock transfer:', error)
    return NextResponse.json(
      { error: 'Failed to create stock transfer' },
      { status: 500 }
    )
  }
}