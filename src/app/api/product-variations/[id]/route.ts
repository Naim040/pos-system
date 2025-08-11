import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

interface RouteParams {
  params: { id: string }
}

// Get single variation
export const GET = withLicenseProtection(async (request: NextRequest, context: RouteParams) => {
  try {
    const { id } = context.params

    const variation = await db.productVariation.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, name: true, price: true }
        },
        attributes: {
          include: {
            attribute: true
          }
        },
        inventory: {
          include: {
            store: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!variation) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ variation })
  } catch (error) {
    console.error('Get variation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variation' },
      { status: 500 }
    )
  }
})

// Update variation
export const PUT = withLicenseProtection(async (request: NextRequest, context: RouteParams) => {
  try {
    const { id } = context.params
    const data = await request.json()
    const { sku, barcode, price, stock, imageUrl, isActive, attributes } = data

    const variation = await db.productVariation.findUnique({
      where: { id }
    })

    if (!variation) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    // Check if SKU is being changed and already exists
    if (sku && sku !== variation.sku) {
      const existingVariation = await db.productVariation.findUnique({
        where: { sku }
      })

      if (existingVariation) {
        return NextResponse.json(
          { error: 'Variation with this SKU already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (sku !== undefined) updateData.sku = sku
    if (barcode !== undefined) updateData.barcode = barcode
    if (price !== undefined && price > 0) updateData.price = price
    if (stock !== undefined) updateData.stock = stock
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedVariation = await db.productVariation.update({
      where: { id },
      data: updateData
    })

    // Update attributes if provided
    if (attributes && Array.isArray(attributes)) {
      // Remove existing attributes
      await db.variationAttribute.deleteMany({
        where: { variationId: id }
      })

      // Add new attributes
      if (attributes.length > 0) {
        const attributeData = attributes.map((attr: any) => ({
          variationId: id,
          attributeId: attr.attributeId,
          attributeValue: attr.value
        }))

        await db.variationAttribute.createMany({
          data: attributeData
        })
      }
    }

    // Fetch the updated variation with attributes
    const finalVariation = await db.productVariation.findUnique({
      where: { id },
      include: {
        attributes: {
          include: {
            attribute: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Variation updated successfully',
      variation: finalVariation
    })
  } catch (error) {
    console.error('Update variation error:', error)
    return NextResponse.json(
      { error: 'Failed to update variation' },
      { status: 500 }
    )
  }
})

// Delete variation (soft delete)
export const DELETE = withLicenseProtection(async (request: NextRequest, context: RouteParams) => {
  try {
    const { id } = context.params

    const variation = await db.productVariation.findUnique({
      where: { id }
    })

    if (!variation) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    await db.productVariation.update({
      where: { id },
      data: { isActive: false }
    })

    // Check if product still has active variations
    const activeVariations = await db.productVariation.count({
      where: { 
        productId: variation.productId,
        isActive: true 
      }
    })

    // Update product hasVariations flag
    if (activeVariations === 0) {
      await db.product.update({
        where: { id: variation.productId },
        data: { hasVariations: false }
      })
    }

    return NextResponse.json({
      message: 'Variation deleted successfully'
    })
  } catch (error) {
    console.error('Delete variation error:', error)
    return NextResponse.json(
      { error: 'Failed to delete variation' },
      { status: 500 }
    )
  }
})