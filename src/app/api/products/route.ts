import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode')
    const sku = searchParams.get('sku')
    const search = searchParams.get('search')

    const whereClause: any = {}

    if (barcode) {
      whereClause.barcode = barcode
    } else if (sku) {
      whereClause.sku = sku
    } else if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const products = await db.product.findMany({
      where: whereClause,
      include: {
        category: true,
        inventory: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, sku, barcode, categoryId, imageUrl } = body

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        sku,
        barcode,
        categoryId,
        imageUrl
      },
      include: {
        category: true,
        inventory: true
      }
    })

    // Create inventory record for the product
    await db.inventory.create({
      data: {
        productId: product.id,
        quantity: 0,
        minStock: 0
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}