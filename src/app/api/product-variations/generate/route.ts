import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

// Generate all possible variations for a product based on selected attributes
export const POST = withLicenseProtection(async (request: NextRequest) => {
  try {
    const data = await request.json()
    const { productId, attributeIds, basePrice, priceAdjustments } = data

    if (!productId || !attributeIds || !Array.isArray(attributeIds) || attributeIds.length === 0) {
      return NextResponse.json(
        { error: 'Product ID and attribute IDs are required' },
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

    // Get selected attributes with their options
    const attributes = await db.attribute.findMany({
      where: {
        id: { in: attributeIds },
        isActive: true,
        type: 'select' // Only select type attributes can generate variations
      },
      orderBy: { name: 'asc' }
    })

    if (attributes.length === 0) {
      return NextResponse.json(
        { error: 'No valid select attributes found' },
        { status: 400 }
      )
    }

    // Parse options for each attribute
    const attributeOptions = attributes.map(attr => ({
      ...attr,
      options: JSON.parse(attr.options || '[]')
    }))

    // Generate all possible combinations
    const combinations = generateCombinations(attributeOptions)

    // Check existing variations to avoid duplicates
    const existingVariations = await db.productVariation.findMany({
      where: { productId },
      include: {
        attributes: {
          include: {
            attribute: true
          }
        }
      }
    })

    // Create a set of existing attribute combinations
    const existingCombinations = new Set(
      existingVariations.map(variation => 
        variation.attributes
          .sort((a, b) => a.attribute.name.localeCompare(b.attribute.name))
          .map(attr => `${attr.attributeId}:${attr.attributeValue}`)
          .join('|')
      )
    )

    const newVariations = []
    const skippedVariations = []

    for (const combination of combinations) {
      const combinationKey = combination
        .sort((a, b) => a.attributeName.localeCompare(b.attributeName))
        .map(attr => `${attr.attributeId}:${attr.value}`)
        .join('|')

      if (existingCombinations.has(combinationKey)) {
        skippedVariations.push(combination)
        continue
      }

      // Calculate price for this variation
      let variationPrice = basePrice || product.price
      if (priceAdjustments) {
        combination.forEach(attr => {
          const adjustment = priceAdjustments[`${attr.attributeId}:${attr.value}`]
          if (adjustment) {
            variationPrice += adjustment
          }
        })
      }

      // Generate SKU
      const skuParts = [
        product.sku || product.name.substring(0, 8).toUpperCase(),
        ...combination.map(attr => 
          attr.value.substring(0, 3).toUpperCase().replace(/\s+/g, '')
        )
      ]
      const sku = skuParts.join('-')

      // Create variation
      const variation = await db.productVariation.create({
        data: {
          productId,
          sku,
          price: variationPrice,
          stock: 0
        }
      })

      // Add attributes
      await db.variationAttribute.createMany({
        data: combination.map(attr => ({
          variationId: variation.id,
          attributeId: attr.attributeId,
          attributeValue: attr.value
        }))
      })

      newVariations.push({
        ...variation,
        attributes: combination
      })
    }

    // Update product to indicate it has variations
    if (newVariations.length > 0) {
      await db.product.update({
        where: { id: productId },
        data: { hasVariations: true }
      })
    }

    return NextResponse.json({
      message: `Generated ${newVariations.length} variations, skipped ${skippedVariations.length} existing variations`,
      newVariations,
      skippedVariations,
      totalCombinations: combinations.length
    })
  } catch (error) {
    console.error('Generate variations error:', error)
    return NextResponse.json(
      { error: 'Failed to generate variations' },
      { status: 500 }
    )
  }
})

// Helper function to generate all combinations of attribute options
function generateCombinations(attributes: any[]): any[] {
  if (attributes.length === 0) return []

  const result: any[] = []

  function generate(index: number, current: any[]) {
    if (index === attributes.length) {
      result.push([...current])
      return
    }

    const attribute = attributes[index]
    for (const option of attribute.options) {
      current.push({
        attributeId: attribute.id,
        attributeName: attribute.name,
        value: option
      })
      generate(index + 1, current)
      current.pop()
    }
  }

  generate(0, [])
  return result
}