import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/loyalty/analytics - Get loyalty program analytics
export async function GET() {
  try {
    // Get basic metrics
    const totalCustomers = await db.customer.count()
    const loyaltyCustomers = await db.customerLoyalty.count()
    
    // Get loyalty transactions summary
    const loyaltyTransactions = await db.loyaltyTransaction.groupBy({
      by: ['type'],
      _sum: {
        points: true
      },
      _count: {
        _all: true
      }
    })

    // Get tier distribution
    const tierDistribution = await db.customerLoyalty.groupBy({
      by: ['currentTier'],
      _count: {
        _all: true
      }
    })

    // Get rewards redeemed
    const redeemedRewards = await db.loyaltyReward.count({
      where: {
        isRedeemed: true
      }
    })

    // Calculate total points
    const totalPointsEarned = loyaltyTransactions.find(t => t.type === 'earned')?._sum.points || 0
    const totalPointsRedeemed = Math.abs(loyaltyTransactions.find(t => t.type === 'redeemed')?._sum.points || 0)

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivity = await db.loyaltyTransaction.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Get top customers by points
    const topCustomers = await db.customerLoyalty.findMany({
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        totalPoints: 'desc'
      },
      take: 10
    })

    // Get monthly trends (simplified for demo)
    const monthlyTrends = await generateMonthlyTrends()

    const analytics = {
      overview: {
        totalCustomers,
        loyaltyCustomers,
        participationRate: totalCustomers > 0 ? (loyaltyCustomers / totalCustomers) * 100 : 0,
        totalPointsEarned,
        totalPointsRedeemed,
        activePointsBalance: totalPointsEarned - totalPointsRedeemed,
        rewardsRedeemed: redeemedRewards,
        recentActivity
      },
      tierDistribution: tierDistribution.map(tier => ({
        tier: tier.currentTier,
        count: tier._count._all,
        percentage: loyaltyCustomers > 0 ? (tier._count._all / loyaltyCustomers) * 100 : 0
      })),
      topCustomers: topCustomers.map(customer => ({
        id: customer.customerId,
        name: customer.customer.name,
        email: customer.customer.email,
        points: customer.totalPoints,
        tier: customer.currentTier
      })),
      monthlyTrends,
      engagement: {
        averagePointsPerCustomer: loyaltyCustomers > 0 ? totalPointsEarned / loyaltyCustomers : 0,
        redemptionRate: totalPointsEarned > 0 ? (totalPointsRedeemed / totalPointsEarned) * 100 : 0,
        activeCustomers: loyaltyCustomers // Simplified - would calculate based on recent activity
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching loyalty analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty analytics' }, { status: 500 })
  }
}

async function generateMonthlyTrends() {
  // Generate mock monthly trends for the last 6 months
  const trends = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' })
    
    trends.push({
      month: monthName,
      newMembers: Math.floor(Math.random() * 50) + 10,
      pointsEarned: Math.floor(Math.random() * 10000) + 2000,
      pointsRedeemed: Math.floor(Math.random() * 5000) + 1000,
      rewardsRedeemed: Math.floor(Math.random() * 100) + 20
    })
  }
  
  return trends
}