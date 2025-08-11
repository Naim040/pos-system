import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/loyalty/customers - Get customer loyalty data
export async function GET() {
  try {
    // Get all customers with their loyalty data
    const customers = await db.customer.findMany({
      include: {
        loyaltyTransactions: true,
        sales: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calculate loyalty metrics for each customer
    const customerLoyaltyData = customers.map(customer => {
      const totalEarned = customer.loyaltyTransactions
        .filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + t.points, 0)
      
      const totalRedeemed = customer.loyaltyTransactions
        .filter(t => t.type === 'redeemed')
        .reduce((sum, t) => sum + t.points, 0)
      
      const currentPoints = totalEarned - totalRedeemed
      
      // Determine current tier based on points
      let currentTier = 'Bronze'
      if (currentPoints >= 5000) currentTier = 'Platinum'
      else if (currentPoints >= 1500) currentTier = 'Gold'
      else if (currentPoints >= 500) currentTier = 'Silver'
      
      // Generate referral code based on customer ID
      const referralCode = `REF${customer.id.slice(-6).toUpperCase()}`
      
      // Calculate referral count (simplified - in real app this would track actual referrals)
      const referralCount = Math.floor(Math.random() * 5) // Mock data
      
      // Get last activity date
      const lastActivity = customer.sales.length > 0 
        ? customer.sales.reduce((latest, sale) => 
            sale.createdAt > latest ? sale.createdAt : latest, 
            new Date(0)
          ).toISOString()
        : customer.createdAt.toISOString()

      return {
        customerId: customer.id,
        customerName: customer.name,
        totalPoints: currentPoints,
        currentTier,
        referralCode,
        referralCount,
        totalEarned,
        totalRedeemed,
        lastActivity,
        pointsExpiring: [] // In real app, this would calculate expiring points
      }
    })

    return NextResponse.json(customerLoyaltyData)
  } catch (error) {
    console.error('Error fetching customer loyalty data:', error)
    return NextResponse.json({ error: 'Failed to fetch customer loyalty data' }, { status: 500 })
  }
}