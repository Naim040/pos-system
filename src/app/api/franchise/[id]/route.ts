import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withFranchiseProtection } from '@/lib/franchiseMiddleware'

export const GET = withFranchiseProtection(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const franchise = await db.franchise.findUnique({
      where: { id: params.id },
      include: {
        users: {
          include: {
            user: true
          }
        },
        clients: true,
        royaltyPayments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        licenses: {
          take: 5
        },
        _count: {
          select: {
            clients: true,
            users: true,
            licenses: true,
            royaltyPayments: true
          }
        }
      }
    })

    if (!franchise) {
      return NextResponse.json(
        { error: 'Franchise not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ franchise })
  } catch (error) {
    console.error('Get franchise error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch franchise' },
      { status: 500 }
    )
  }
})