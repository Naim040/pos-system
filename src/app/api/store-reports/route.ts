import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const reportType = searchParams.get('reportType')
    const period = searchParams.get('period')

    const whereClause: any = {}
    if (storeId) whereClause.storeId = storeId
    if (reportType) whereClause.reportType = reportType
    if (period) whereClause.period = period

    const reports = await db.storeReport.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching store reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      storeId,
      reportType,
      period,
      totalSales,
      totalProfit,
      totalTransactions,
      averageTransaction,
      topProducts,
      customerMetrics,
      inventoryMetrics
    } = body

    // Validate required fields
    if (!storeId || !reportType || !period) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if store exists
    const store = await db.store.findUnique({
      where: { id: storeId }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    const report = await db.storeReport.create({
      data: {
        storeId,
        reportType,
        period,
        totalSales: totalSales || 0,
        totalProfit: totalProfit || 0,
        totalTransactions: totalTransactions || 0,
        averageTransaction: averageTransaction || 0,
        topProducts: topProducts ? JSON.stringify(topProducts) : null,
        customerMetrics: customerMetrics ? JSON.stringify(customerMetrics) : null,
        inventoryMetrics: inventoryMetrics ? JSON.stringify(inventoryMetrics) : null
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error creating store report:', error)
    return NextResponse.json(
      { error: 'Failed to create store report' },
      { status: 500 }
    )
  }
}