import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface CustomerSegment {
  name: string
  count: number
  revenue: number
  growth: number
  color: string
}

export async function GET(request: NextRequest) {
  try {
    // Get customer data with their purchase history
    const customers = await db.customer.findMany({
      include: {
        sales: {
          where: {
            status: 'completed'
          },
          select: {
            totalAmount: true,
            createdAt: true
          }
        },
        loyaltyTransactions: {
          select: {
            points: true,
            type: true,
            createdAt: true
          }
        }
      }
    })

    // Calculate customer metrics
    const customerMetrics = customers.map(customer => {
      const totalSpent = customer.sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalOrders = customer.sales.length
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
      const loyaltyPoints = customer.loyaltyPoints
      
      // Calculate purchase frequency (days between purchases)
      const sortedSales = [...customer.sales].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      
      let avgDaysBetweenPurchases = 0
      if (sortedSales.length > 1) {
        const totalDays = sortedSales.slice(1).reduce((sum, sale, index) => {
          const daysDiff = Math.floor(
            (new Date(sale.createdAt).getTime() - new Date(sortedSales[index].createdAt).getTime()) 
            / (1000 * 60 * 60 * 24)
          )
          return sum + daysDiff
        }, 0)
        avgDaysBetweenPurchases = totalDays / (sortedSales.length - 1)
      }
      
      // Get recent vs historical spending
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentSales = customer.sales.filter(sale => 
        new Date(sale.createdAt) >= thirtyDaysAgo
      )
      const recentSpending = recentSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      
      const olderSales = customer.sales.filter(sale => 
        new Date(sale.createdAt) >= ninetyDaysAgo && new Date(sale.createdAt) < thirtyDaysAgo
      )
      const olderSpending = olderSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      
      // Calculate growth rate
      const growthRate = olderSpending > 0 ? 
        ((recentSpending - olderSpending) / olderSpending) * 100 : 0
      
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalSpent,
        totalOrders,
        averageOrderValue,
        loyaltyPoints,
        loyaltyTier: customer.loyaltyTier,
        avgDaysBetweenPurchases,
        recentSpending,
        olderSpending,
        growthRate,
        lastPurchaseDate: sortedSales.length > 0 ? sortedSales[sortedSales.length - 1].createdAt : null,
        firstPurchaseDate: sortedSales.length > 0 ? sortedSales[0].createdAt : null
      }
    })

    // Segment customers based on RFM analysis (Recency, Frequency, Monetary)
    const segments = {
      vip: [] as typeof customerMetrics,
      regular: [] as typeof customerMetrics,
      occasional: [] as typeof customerMetrics,
      new: [] as typeof customerMetrics,
      atRisk: [] as typeof customerMetrics,
      inactive: [] as typeof customerMetrics
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    customerMetrics.forEach(customer => {
      const lastPurchase = customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate) : null
      const daysSinceLastPurchase = lastPurchase ? 
        Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24)) : 999

      // VIP Customers: High spending, frequent purchases, recent activity
      if (customer.totalSpent >= 500 && customer.totalOrders >= 5 && daysSinceLastPurchase <= 30) {
        segments.vip.push(customer)
      }
      // Regular Customers: Moderate spending, regular purchases
      else if (customer.totalSpent >= 100 && customer.totalOrders >= 2 && daysSinceLastPurchase <= 60) {
        segments.regular.push(customer)
      }
      // New Customers: Recent first purchase
      else if (customer.firstPurchaseDate && new Date(customer.firstPurchaseDate) >= thirtyDaysAgo) {
        segments.new.push(customer)
      }
      // Occasional Customers: Some purchases but not frequent
      else if (customer.totalOrders >= 1 && daysSinceLastPurchase <= 90) {
        segments.occasional.push(customer)
      }
      // At Risk: Previously active but haven't purchased recently
      else if (customer.totalSpent >= 50 && daysSinceLastPurchase > 60 && daysSinceLastPurchase <= 180) {
        segments.atRisk.push(customer)
      }
      // Inactive: No recent purchases
      else {
        segments.inactive.push(customer)
      }
    })

    // Calculate segment metrics
    const segmentData: CustomerSegment[] = [
      {
        name: "VIP Customers",
        count: segments.vip.length,
        revenue: segments.vip.reduce((sum, customer) => sum + customer.totalSpent, 0),
        growth: segments.vip.length > 0 ? 
          segments.vip.reduce((sum, customer) => sum + customer.growthRate, 0) / segments.vip.length : 0,
        color: "#8B5CF6"
      },
      {
        name: "Regular Customers",
        count: segments.regular.length,
        revenue: segments.regular.reduce((sum, customer) => sum + customer.totalSpent, 0),
        growth: segments.regular.length > 0 ? 
          segments.regular.reduce((sum, customer) => sum + customer.growthRate, 0) / segments.regular.length : 0,
        color: "#3B82F6"
      },
      {
        name: "Occasional Buyers",
        count: segments.occasional.length,
        revenue: segments.occasional.reduce((sum, customer) => sum + customer.totalSpent, 0),
        growth: segments.occasional.length > 0 ? 
          segments.occasional.reduce((sum, customer) => sum + customer.growthRate, 0) / segments.occasional.length : 0,
        color: "#10B981"
      },
      {
        name: "New Customers",
        count: segments.new.length,
        revenue: segments.new.reduce((sum, customer) => sum + customer.totalSpent, 0),
        growth: segments.new.length > 0 ? 
          segments.new.reduce((sum, customer) => sum + customer.growthRate, 0) / segments.new.length : 0,
        color: "#F59E0B"
      }
    ]

    // Filter out segments with no customers
    const filteredSegments = segmentData.filter(segment => segment.count > 0)

    return NextResponse.json(filteredSegments)
  } catch (error) {
    console.error('Error generating customer segments:', error)
    
    // Fallback to basic segments
    const fallbackSegments = [
      {
        name: "VIP Customers",
        count: 0,
        revenue: 0,
        growth: 0,
        color: "#8B5CF6"
      },
      {
        name: "Regular Customers",
        count: 0,
        revenue: 0,
        growth: 0,
        color: "#3B82F6"
      },
      {
        name: "Occasional Buyers",
        count: 0,
        revenue: 0,
        growth: 0,
        color: "#10B981"
      },
      {
        name: "New Customers",
        count: 0,
        revenue: 0,
        growth: 0,
        color: "#F59E0B"
      }
    ]
    
    return NextResponse.json(fallbackSegments)
  }
}