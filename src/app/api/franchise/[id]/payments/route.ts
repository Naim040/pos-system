import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withFranchiseProtection } from '@/lib/franchiseMiddleware'

// Get franchise payments
export const GET = withFranchiseProtection(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const payments = await db.royaltyPayment.findMany({
      where: { franchiseId: params.id },
      include: {
        client: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Get franchise payments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch franchise payments' },
      { status: 500 }
    )
  }
})