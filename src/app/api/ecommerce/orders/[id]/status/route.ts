import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update order status
    const order = await db.ecommerceOrder.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        store: true
      }
    })

    return NextResponse.json({
      success: true,
      order,
      message: `Order status updated to ${status}`
    })
  } catch (error) {
    console.error('Error updating e-commerce order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}