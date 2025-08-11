import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

// Get variation inventory
export const GET = withLicenseProtection(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const variationId = searchParams.get('variationId')
    const storeId = searchParams.get('storeId')

    if (!variationId) {
      return NextResponse.json(
        { error: 'Variation ID is required' },
        { status: 400 }
      )
    }

    const where: any = { variationId }
    if (storeId) where.storeId = storeId

    const inventory = await db.variationInventory.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true, code: true }
        },
        variation: {
          select: { id: true, sku: true, price: true }
        }
      }
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error('Get variation inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variation inventory' },
      { status: 500 }
    )
  }
})

// Create or update variation inventory
export const POST = withLicenseProtection(async (request: NextRequest) => {
  try {
    const data = await request.json()
    const { variationId, storeId, quantity, minStock, maxStock, reorderPoint, location, aisle, shelf, bin } = data

    if (!variationId || !storeId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Variation ID, store ID, and quantity are required' },
        { status: 400 }
      )
    }

    // Check if variation exists
    const variation = await db.productVariation.findUnique({
      where: { id: variationId }
    })

    if (!variation) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    // Check if store exists
    const store = await db.store.findUnique({
      where: { id: storeId }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    // Check if inventory record exists
    const existingInventory = await db.variationInventory.findUnique({
      where: {
        variationId_storeId: {
          variationId,
          storeId
        }
      }
    })

    let inventory

    if (existingInventory) {
      // Update existing inventory
      inventory = await db.variationInventory.update({
        where: {
          variationId_storeId: {
            variationId,
            storeId
          }
        },
        data: {
          quantity,
          minStock: minStock || 0,
          maxStock: maxStock || null,
          reorderPoint: reorderPoint || 0,
          location: location || null,
          aisle: aisle || null,
          shelf: shelf || null,
          bin: bin || null
        }
      })
    } else {
      // Create new inventory record
      inventory = await db.variationInventory.create({
        data: {
          variationId,
          storeId,
          quantity,
          minStock: minStock || 0,
          maxStock: maxStock || null,
          reorderPoint: reorderPoint || 0,
          location: location || null,
          aisle: aisle || null,
          shelf: shelf || null,
          bin: bin || null
        }
      })
    }

    return NextResponse.json({
      message: 'Variation inventory updated successfully',
      inventory
    })
  } catch (error) {
    console.error('Update variation inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to update variation inventory' },
      { status: 500 }
    )
  }
})