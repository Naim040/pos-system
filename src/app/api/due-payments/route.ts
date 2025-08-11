import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const duePayments = await db.customerLedger.findMany({
      where: {
        type: 'sale',
        amount: {
          gt: 0 // Only show positive amounts (sales that created dues)
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            dueBalance: true,
            loyaltyPoints: true,
            loyaltyTier: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    const formattedDuePayments = duePayments.map(payment => ({
      id: payment.id,
      customerId: payment.customerId,
      customer: payment.customer,
      amount: payment.amount,
      balance: payment.balance,
      description: payment.description || '',
      referenceId: payment.referenceId,
      date: payment.date.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      type: payment.type
    }))

    return NextResponse.json(formattedDuePayments)
  } catch (error) {
    console.error('Error fetching due payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch due payments' },
      { status: 500 }
    )
  }
}