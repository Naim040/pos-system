import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

// Get all royalty payments (admin only)
export const GET = withLicenseProtection(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const franchiseId = searchParams.get('franchiseId')
    const status = searchParams.get('status')
    const paymentType = searchParams.get('paymentType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}
    if (franchiseId) where.franchiseId = franchiseId
    if (status) where.status = status
    if (paymentType) where.paymentType = paymentType

    const [payments, total] = await Promise.all([
      db.royaltyPayment.findMany({
        where,
        include: {
          franchise: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          client: {
            select: {
              id: true,
              clientName: true,
              clientEmail: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.royaltyPayment.count({ where })
    ])

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get royalty payments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch royalty payments' },
      { status: 500 }
    )
  }
})

// Process royalty payment (admin only)
export const POST = withLicenseProtection(async (request: NextRequest) => {
  try {
    const { paymentIds, paymentMethod, transactionId, notes } = await request.json()

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Payment IDs are required' },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      )
    }

    // Process each payment
    const processedPayments = []
    let totalAmount = 0

    for (const paymentId of paymentIds) {
      const payment = await db.royaltyPayment.findUnique({
        where: { id: paymentId },
        include: {
          franchise: true,
          client: true
        }
      })

      if (!payment) {
        return NextResponse.json(
          { error: `Payment with ID ${paymentId} not found` },
          { status: 404 }
        )
      }

      if (payment.status === 'paid') {
        continue // Skip already paid payments
      }

      // Update payment status
      const updatedPayment = await db.royaltyPayment.update({
        where: { id: paymentId },
        data: {
          status: 'paid',
          paidDate: new Date(),
          paymentMethod,
          transactionId,
          notes: notes || payment.notes
        }
      })

      // Update franchise outstanding balance
      await db.franchise.update({
        where: { id: payment.franchiseId },
        data: {
          outstandingBalance: {
            decrement: payment.amount
          },
          totalRevenue: {
            increment: payment.amount
          }
        }
      })

      // Update client payment status if applicable
      if (payment.clientId) {
        if (payment.paymentType === 'one_time') {
          await db.franchiseClient.update({
            where: { id: payment.clientId },
            data: {
              oneTimeFeePaid: true,
              lastPaymentDate: new Date(),
              totalPaid: {
                increment: payment.amount
              }
            }
          })
        } else if (payment.paymentType === 'monthly') {
          await db.franchiseClient.update({
            where: { id: payment.clientId },
            data: {
              monthlyFeePaid: true,
              lastPaymentDate: new Date(),
              totalPaid: {
                increment: payment.amount
              }
            }
          })

          // Create next monthly payment
          const nextPaymentDate = new Date()
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)

          await db.royaltyPayment.create({
            data: {
              franchiseId: payment.franchiseId,
              clientId: payment.clientId,
              amount: payment.franchise.monthlyFee,
              currency: 'USD',
              paymentType: 'monthly',
              status: 'pending',
              dueDate: nextPaymentDate,
              createdBy: 'system'
            }
          })
        }
      }

      processedPayments.push(updatedPayment)
      totalAmount += payment.amount
    }

    return NextResponse.json({
      message: `Successfully processed ${processedPayments.length} payments`,
      totalAmount,
      payments: processedPayments
    })

  } catch (error) {
    console.error('Process royalty payments error:', error)
    return NextResponse.json(
      { error: 'Failed to process royalty payments' },
      { status: 500 }
    )
  }
})