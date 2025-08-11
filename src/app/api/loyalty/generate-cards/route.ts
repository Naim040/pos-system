import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/loyalty/generate-cards - Generate loyalty cards for all customers
export async function POST(request: NextRequest) {
  try {
    // Get all customers
    const customers = await db.customer.findMany({
      include: {
        customerLoyalty: true
      }
    })

    // Get loyalty program
    const store = await db.store.findFirst()
    if (!store) {
      return NextResponse.json({ error: 'No store found' }, { status: 404 })
    }

    const program = await db.loyaltyProgram.findUnique({
      where: { storeId: store.id }
    })

    if (!program) {
      return NextResponse.json({ error: 'No loyalty program found' }, { status: 404 })
    }

    let generatedCount = 0
    let updatedCount = 0

    // Generate or update loyalty data for each customer
    for (const customer of customers) {
      if (!customer.customerLoyalty) {
        // Create new loyalty record
        await db.customerLoyalty.create({
          data: {
            customerId: customer.id,
            programId: program.id,
            currentTier: 'bronze',
            totalPoints: program.signupBonus || 0,
            totalEarned: program.signupBonus || 0,
            referralCode: generateReferralCode(customer.id),
            joinDate: new Date(),
            lastActivity: new Date()
          }
        })
        generatedCount++
      } else {
        // Update existing loyalty record with referral code if missing
        if (!customer.customerLoyalty.referralCode) {
          await db.customerLoyalty.update({
            where: { customerId: customer.id },
            data: {
              referralCode: generateReferralCode(customer.id)
            }
          })
          updatedCount++
        }
      }
    }

    return NextResponse.json({
      message: 'Loyalty cards generated successfully',
      generated: generatedCount,
      updated: updatedCount,
      total: customers.length
    })
  } catch (error) {
    console.error('Error generating loyalty cards:', error)
    return NextResponse.json({ error: 'Failed to generate loyalty cards' }, { status: 500 })
  }
}

function generateReferralCode(customerId: string): string {
  // Generate a unique referral code based on customer ID and random component
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  const customerPart = customerId.slice(-4).toUpperCase()
  return `LOYAL-${customerPart}${randomPart}`
}