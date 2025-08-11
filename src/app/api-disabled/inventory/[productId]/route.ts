import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const body = await request.json()
    const { quantity, minStock, maxStock } = body

    if (quantity === undefined || minStock === undefined) {
      return NextResponse.json(
        { error: 'Quantity and minStock are required' },
        { status: 400 }
      )
    }

    // Check if inventory exists for this product
    let inventory = await db.inventory.findUnique({
      where: { productId: params.productId }
    })

    if (!inventory) {
      // Create inventory record if it doesn't exist
      inventory = await db.inventory.create({
        data: {
          productId: params.productId,
          quantity: parseInt(quantity),
          minStock: parseInt(minStock),
          maxStock: maxStock ? parseInt(maxStock) : null
        },
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      })
    } else {
      // Update existing inventory
      inventory = await db.inventory.update({
        where: { productId: params.productId },
        data: {
          quantity: parseInt(quantity),
          minStock: parseInt(minStock),
          maxStock: maxStock ? parseInt(maxStock) : null
        },
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      })
    }

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}