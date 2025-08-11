import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    
    // Calculate date range based on the selected range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get total revenue for the period
    const salesResult = await db.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      },
      select: {
        totalAmount: true,
        taxAmount: true,
        discount: true,
        createdAt: true
      }
    })

    const totalRevenue = salesResult.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalTax = salesResult.reduce((sum, sale) => sum + sale.taxAmount, 0)
    const totalDiscount = salesResult.reduce((sum, sale) => sum + sale.discount, 0)

    // Get previous period data for comparison
    const previousEndDate = new Date(startDate)
    const previousStartDate = new Date(startDate)
    const periodDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    previousStartDate.setDate(previousStartDate.getDate() - periodDays)

    const previousSalesResult = await db.sale.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate
        },
        status: 'completed'
      },
      select: {
        totalAmount: true
      }
    })

    const previousRevenue = previousSalesResult.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Get active customers (customers who made a purchase in the period)
    const activeCustomers = await db.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed',
        customerId: { not: null }
      },
      select: {
        customerId: true
      },
      distinct: ['customerId']
    })

    const activeCustomerCount = activeCustomers.length

    // Get previous period active customers
    const previousActiveCustomers = await db.sale.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate
        },
        status: 'completed',
        customerId: { not: null }
      },
      select: {
        customerId: true
      },
      distinct: ['customerId']
    })

    const previousActiveCustomerCount = previousActiveCustomers.length
    const customerChange = previousActiveCustomerCount > 0 ? 
      ((activeCustomerCount - previousActiveCustomerCount) / previousActiveCustomerCount) * 100 : 0

    // Calculate average order value
    const totalOrders = salesResult.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const previousTotalOrders = previousSalesResult.length
    const previousAverageOrderValue = previousTotalOrders > 0 ? previousRevenue / previousTotalOrders : 0
    const aovChange = previousAverageOrderValue > 0 ? 
      ((averageOrderValue - previousAverageOrderValue) / previousAverageOrderValue) * 100 : 0

    // Calculate inventory turnover
    const inventoryItems = await db.inventory.findMany({
      where: {
        isActive: true
      },
      select: {
        quantity: true,
        costPrice: true
      }
    })

    const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0)
    const inventoryTurnover = totalInventoryValue > 0 ? totalRevenue / totalInventoryValue : 0

    // Get previous period inventory turnover
    const previousInventoryTurnover = totalInventoryValue > 0 ? previousRevenue / totalInventoryValue : 0
    const turnoverChange = previousInventoryTurnover > 0 ? 
      ((inventoryTurnover - previousInventoryTurnover) / previousInventoryTurnover) * 100 : 0

    // Format the metrics
    const metrics = [
      {
        title: "Total Revenue",
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'BDT'
        }).format(totalRevenue),
        change: parseFloat(revenueChange.toFixed(1)),
        trend: revenueChange >= 0 ? 'up' as const : 'down' as const,
        icon: "dollar-sign",
        description: "vs previous period"
      },
      {
        title: "Active Customers",
        value: activeCustomerCount.toString(),
        change: parseFloat(customerChange.toFixed(1)),
        trend: customerChange >= 0 ? 'up' as const : 'down' as const,
        icon: "users",
        description: "vs previous period"
      },
      {
        title: "Average Order Value",
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'BDT'
        }).format(averageOrderValue),
        change: parseFloat(aovChange.toFixed(1)),
        trend: aovChange >= 0 ? 'up' as const : 'down' as const,
        icon: "shopping-cart",
        description: "vs previous period"
      },
      {
        title: "Inventory Turnover",
        value: `${inventoryTurnover.toFixed(1)}x`,
        change: parseFloat(turnoverChange.toFixed(1)),
        trend: turnoverChange >= 0 ? 'up' as const : 'down' as const,
        icon: "package",
        description: "vs previous period"
      }
    ]

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching analytics metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics metrics' },
      { status: 500 }
    )
  }
}