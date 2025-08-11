import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const storeId = searchParams.get('storeId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (storeId) where.storeId = storeId

    // Get orders with store details
    const orders = await db.ecommerceOrder.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            platformName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Parse JSON fields
    const parsedOrders = orders.map(order => ({
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress),
      billingAddress: JSON.parse(order.billingAddress),
      items: JSON.parse(order.items)
    }))

    return NextResponse.json(parsedOrders)
  } catch (error) {
    console.error('Error fetching e-commerce orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch e-commerce orders' },
      { status: 500 }
    )
  }
}