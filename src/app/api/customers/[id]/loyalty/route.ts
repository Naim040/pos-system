import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactions = await db.loyaltyTransaction.findMany({
      where: { customerId: params.id },
      include: {
        sale: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching loyalty transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty transactions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { points, type, description } = await request.json()

    if (!points || !type) {
      return NextResponse.json(
        { error: 'Points and type are required' },
        { status: 400 }
      )
    }

    const customer = await db.customer.findUnique({
      where: { id: params.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if customer has enough points for redemption
    if (type === 'redeemed' && customer.loyaltyPoints < Math.abs(points)) {
      return NextResponse.json(
        { error: 'Insufficient loyalty points' },
        { status: 400 }
      )
    }

    // Update customer points
    const newPoints = type === 'redeemed' ? customer.loyaltyPoints - Math.abs(points) : customer.loyaltyPoints + points
    await db.customer.update({
      where: { id: params.id },
      data: { loyaltyPoints: newPoints }
    })

    // Create loyalty transaction
    const transaction = await db.loyaltyTransaction.create({
      data: {
        customerId: params.id,
        points: type === 'redeemed' ? -Math.abs(points) : points,
        type,
        description: description || `${type === 'redeemed' ? 'Redeemed' : 'Earned'} ${Math.abs(points)} points`
      }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating loyalty transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create loyalty transaction' },
      { status: 500 }
    )
  }
}