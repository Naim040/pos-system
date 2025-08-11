import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await db.ecommerceOrder.findUnique({
      where: { id: params.id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            platformName: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const parsedOrder = {
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress),
      billingAddress: JSON.parse(order.billingAddress),
      items: JSON.parse(order.items)
    }

    return NextResponse.json(parsedOrder)
  } catch (error) {
    console.error('Error fetching e-commerce order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch e-commerce order' },
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
    const { status, paymentStatus, trackingNumber, notes } = body

    const order = await db.ecommerceOrder.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(notes !== undefined && { notes })
      },
      include: {
        store: true
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating e-commerce order:', error)
    return NextResponse.json(
      { error: 'Failed to update e-commerce order' },
      { status: 500 }
    )
  }
}