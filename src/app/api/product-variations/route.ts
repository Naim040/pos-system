import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

// Get product variations
export const GET = withLicenseProtection(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const variations = await db.productVariation.findMany({
      where: { 
        productId,
        isActive: true 
      },
      include: {
        attributes: {
          include: {
            attribute: true
          }
        },
        inventory: {
          where: { isActive: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ variations })
  } catch (error) {
    console.error('Get product variations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product variations' },
      { status: 500 }
    )
  }
})

// Create product variation
export const POST = withLicenseProtection(async (request: NextRequest) => {
  try {
    const data = await request.json()
    const { productId, sku, barcode, price, stock, imageUrl, attributes } = data

    if (!productId || !price || price <= 0) {
      return NextResponse.json(
        { error: 'Product ID and valid price are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if SKU already exists (if provided)
    if (sku) {
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

    // Update product to indicate it has variations
    await db.product.update({
      where: { id: productId },
      data: { hasVariations: true }
    })

    // Create the variation
    const variation = await db.productVariation.create({
      data: {
        productId,
        sku: sku || null,
        barcode: barcode || null,
        price,
        stock: stock || 0,
        imageUrl: imageUrl || null
      }
    })

    // Add attributes if provided
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      const attributeData = attributes.map((attr: any) => ({
        variationId: variation.id,
        attributeId: attr.attributeId,
        attributeValue: attr.value
      }))

      await db.variationAttribute.createMany({
        data: attributeData
      })
    }

    // Fetch the created variation with attributes
    const createdVariation = await db.productVariation.findUnique({
      where: { id: variation.id },
      include: {
        attributes: {
          include: {
            attribute: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Product variation created successfully',
      variation: createdVariation
    })
  } catch (error) {
    console.error('Create product variation error:', error)
    return NextResponse.json(
      { error: 'Failed to create product variation' },
      { status: 500 }
    )
  }
})