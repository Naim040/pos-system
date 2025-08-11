import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { customerId, amount, paymentMethod, description } = await request.json()

    if (!customerId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Customer ID, amount, and payment method are required' },
        { status: 400 }
      )
    }

    const paymentAmount = parseFloat(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    // Get customer details
    const customer = await db.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (customer.dueBalance < paymentAmount) {
      return NextResponse.json(
        { error: 'Payment amount exceeds customer due balance' },
        { status: 400 }
      )
    }

    // Create a default user if none exists (for demo purposes)
    let user = await db.user.findFirst()
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'staff@pos.com',
          name: 'Staff User',
          role: 'staff'
        }
      })
    }

    // Update customer due balance
    const newDueBalance = customer.dueBalance - paymentAmount
    await db.customer.update({
      where: { id: customerId },
      data: {
        dueBalance: newDueBalance
      }
    })

    // Generate a transaction ID for due payments
    const transactionId = `DUE-${Date.now()}`

    // Create customer ledger entry for the payment received
    const ledgerEntry = await db.customerLedger.create({
      data: {
        customerId: customerId,
        type: 'payment',
        amount: -paymentAmount, // Negative amount for payments
        balance: newDueBalance,
        description: description || `Payment received via ${paymentMethod}`,
        referenceId: transactionId,
        createdBy: user.id
      }
    })

    // Update customer stats (totalSpent and loyalty points should be updated when due is paid)
    const loyaltyPointsEarned = Math.floor(paymentAmount / 10) // 1 point per $10 spent
    await db.customer.update({
      where: { id: customerId },
      data: {
        totalSpent: customer.totalSpent + paymentAmount,
        loyaltyPoints: customer.loyaltyPoints + loyaltyPointsEarned,
        loyaltyTier: getLoyaltyTier(customer.totalSpent + paymentAmount)
      }
    })

    // Create loyalty transaction
    await db.loyaltyTransaction.create({
      data: {
        customerId: customerId,
        points: loyaltyPointsEarned,
        type: 'earned',
        description: `Earned ${loyaltyPointsEarned} points from due payment`
      }
    })

    return NextResponse.json({
      id: ledgerEntry.id,
      customerId: ledgerEntry.customerId,
      amount: paymentAmount,
      balance: newDueBalance,
      description: ledgerEntry.description,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      date: ledgerEntry.date.toISOString(),
      createdAt: ledgerEntry.createdAt.toISOString()
    })

  } catch (error) {
    console.error('Error processing due payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

// Helper function to determine loyalty tier
function getLoyaltyTier(totalSpent: number): string {
  if (totalSpent >= 10000) return 'platinum'
  if (totalSpent >= 5000) return 'gold'
  if (totalSpent >= 2000) return 'silver'
  return 'bronze'
}