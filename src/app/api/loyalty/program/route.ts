import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/loyalty/program - Get loyalty program configuration
export async function GET() {
  try {
    // Get the first store
    const store = await db.store.findFirst()
    
    if (!store) {
      return NextResponse.json({ error: 'No store found' }, { status: 404 })
    }

    // Get loyalty program settings
    const program = await db.loyaltyProgram.findUnique({
      where: { storeId: store.id }
    })

    // If no program exists, return default configuration
    if (!program) {
      const defaultProgram = {
        id: 'default',
        name: 'Premium Rewards',
        description: 'Earn points with every purchase and unlock exclusive benefits',
        isActive: true,
        pointsPerDollar: 1,
        signupBonus: 50,
        birthdayBonus: 100,
        referralBonus: 25,
        tiers: [
          {
            id: '1',
            name: 'Bronze',
            description: 'Starting your loyalty journey',
            minPoints: 0,
            maxPoints: 499,
            benefits: ['1 point per $1 spent', 'Birthday reward', 'Newsletter access'],
            color: '#CD7F32',
            icon: '🥉'
          },
          {
            id: '2',
            name: 'Silver',
            description: 'Valued customer status',
            minPoints: 500,
            maxPoints: 1499,
            benefits: ['1.2 points per $1 spent', 'Birthday reward', 'Exclusive offers', 'Priority support'],
            color: '#C0C0C0',
            icon: '🥈'
          },
          {
            id: '3',
            name: 'Gold',
            description: 'Premium customer experience',
            minPoints: 1500,
            maxPoints: 4999,
            benefits: ['1.5 points per $1 spent', 'Birthday reward', 'VIP events', 'Free shipping', 'Dedicated support'],
            color: '#FFD700',
            icon: '🥇'
          },
          {
            id: '4',
            name: 'Platinum',
            description: 'Elite member status',
            minPoints: 5000,
            benefits: ['2 points per $1 spent', 'Birthday reward', 'Exclusive events', 'Free shipping', 'Personal concierge', 'Early access'],
            color: '#E5E4E2',
            icon: '💎'
          }
        ],
        rewards: [
          {
            id: '1',
            name: '$5 Discount',
            description: 'Get $5 off your next purchase',
            pointsRequired: 500,
            type: 'discount',
            value: 5,
            isActive: true,
            expiryDays: 90
          },
          {
            id: '2',
            name: 'Free Coffee',
            description: 'Complimentary coffee of your choice',
            pointsRequired: 200,
            type: 'free_item',
            value: 0,
            isActive: true
          },
          {
            id: '3',
            name: '10% Cashback',
            description: 'Get 10% cashback on your purchase',
            pointsRequired: 1000,
            type: 'cashback',
            value: 10,
            isActive: true
          }
        ],
        earningRules: [
          {
            id: '1',
            name: 'Birthday Bonus',
            description: 'Earn bonus points on your birthday',
            points: 100,
            condition: 'customer_birthday',
            isActive: true
          },
          {
            id: '2',
            name: 'Review Bonus',
            description: 'Earn points for leaving product reviews',
            points: 25,
            condition: 'product_review',
            isActive: true
          },
          {
            id: '3',
            name: 'Social Share',
            description: 'Earn points for sharing on social media',
            points: 50,
            condition: 'social_share',
            isActive: true
          }
        ]
      }
      return NextResponse.json(defaultProgram)
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error fetching loyalty program:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty program' }, { status: 500 })
  }
}

// PUT /api/loyalty/program - Update loyalty program configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get the first store
    const store = await db.store.findFirst()
    
    if (!store) {
      return NextResponse.json({ error: 'No store found' }, { status: 404 })
    }

    // Update or create loyalty program
    const existingProgram = await db.loyaltyProgram.findUnique({
      where: { storeId: store.id }
    })

    if (existingProgram) {
      const updatedProgram = await db.loyaltyProgram.update({
        where: { storeId: store.id },
        data: {
          ...body,
          updatedAt: new Date()
        }
      })
      return NextResponse.json(updatedProgram)
    } else {
      const newProgram = await db.loyaltyProgram.create({
        data: {
          storeId: store.id,
          ...body,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      return NextResponse.json(newProgram)
    }
  } catch (error) {
    console.error('Error updating loyalty program:', error)
    return NextResponse.json({ error: 'Failed to update loyalty program' }, { status: 500 })
  }
}