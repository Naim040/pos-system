import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = await db.ecommerceStore.findUnique({
      where: { id: params.id },
      include: {
        platform: true,
        _count: {
          select: {
            products: true,
            orders: true
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

    const storeWithDetails = {
      ...store,
      platformName: store.platform.name,
      productCount: store._count.products,
      orderCount: store._count.orders
    }

    return NextResponse.json(storeWithDetails)
  } catch (error) {
    console.error('Error fetching e-commerce store:', error)
    return NextResponse.json(
      { error: 'Failed to fetch e-commerce store' },
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
    const { name, storeUrl, apiKey, apiSecret, config, isActive, autoSync, syncInterval } = body

    const store = await db.ecommerceStore.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(storeUrl && { storeUrl }),
        ...(apiKey && { apiKey }),
        ...(apiSecret !== undefined && { apiSecret }),
        ...(config && { config: JSON.stringify(config) }),
        ...(isActive !== undefined && { isActive }),
        ...(autoSync !== undefined && { autoSync }),
        ...(syncInterval !== undefined && { syncInterval })
      },
      include: {
        platform: true
      }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error updating e-commerce store:', error)
    return NextResponse.json(
      { error: 'Failed to update e-commerce store' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.ecommerceStore.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting e-commerce store:', error)
    return NextResponse.json(
      { error: 'Failed to delete e-commerce store' },
      { status: 500 }
    )
  }
}