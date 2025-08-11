import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { smsService } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, dryRun = false } = body

    // Load SMS settings
    await smsService.loadSettings()
    const settings = await smsService['settings'] // Access private property for checking
    
    if (!settings?.triggers?.dailySalesSummary?.enabled) {
      return NextResponse.json({ 
        error: 'Daily sales summary SMS trigger is disabled' 
      }, { status: 400 })
    }

    // Use provided date or default to yesterday
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setDate(targetDate.getDate() - 1) // Yesterday

    // Set date range for the target day
    const startDate = new Date(targetDate)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(targetDate)
    endDate.setHours(23, 59, 59, 999)

    // Get sales data for the target date
    const sales = await db.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true
              }
            }
          }
        },
        customer: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate sales metrics
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const transactionCount = sales.length
    const averageTransaction = transactionCount > 0 ? totalSales / transactionCount : 0

    // Get store information
    const store = await db.store.findFirst()

    // Prepare summary data
    const summaryData = {
      date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD format
      totalSales,
      transactionCount,
      averageTransaction,
      storeName: store?.name || 'POS System'
    }

    // Get recipients from settings
    const recipients = settings?.triggers?.dailySalesSummary?.recipients || []
    
    if (recipients.length === 0) {
      return NextResponse.json({ 
        error: 'No recipients configured for daily sales summary' 
      }, { status: 400 })
    }

    const results = []

    for (const recipient of recipients) {
      if (dryRun) {
        results.push({
          recipient,
          wouldSend: true,
          summaryData
        })
      } else {
        try {
          const result = await smsService.sendDailySalesSummarySMS([recipient], summaryData)

          results.push({
            recipient,
            sent: result[0]?.success || false,
            error: result[0]?.error,
            messageId: result[0]?.messageId,
            summaryData
          })
        } catch (error) {
          results.push({
            recipient,
            sent: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            summaryData
          })
        }
      }
    }

    const responseSummary = {
      date: targetDate.toISOString().split('T')[0],
      totalSales,
      transactionCount,
      averageTransaction,
      totalRecipients: recipients.length,
      messagesSent: results.filter(r => r.sent || r.wouldSend).length,
      messagesFailed: results.filter(r => !r.sent && !r.wouldSend && r.error).length,
      dryRun,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      summary: responseSummary,
      results,
      settings: {
        enabled: settings?.triggers?.dailySalesSummary?.enabled,
        recipients,
        time: settings?.triggers?.dailySalesSummary?.time
      }
    })

  } catch (error) {
    console.error('Error sending daily sales summary:', error)
    return NextResponse.json(
      { error: 'Failed to send daily sales summary' },
      { status: 500 }
    )
  }
}

// GET endpoint for checking status and preview
export async function GET() {
  try {
    // Load SMS settings
    await smsService.loadSettings()
    const settings = await smsService['settings']

    // Get yesterday's date for preview
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Set date range for yesterday
    const startDate = new Date(yesterday)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(yesterday)
    endDate.setHours(23, 59, 59, 999)

    // Get sales data for yesterday
    const sales = await db.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      }
    })

    // Calculate sales metrics
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const transactionCount = sales.length
    const averageTransaction = transactionCount > 0 ? totalSales / transactionCount : 0

    // Get store information
    const store = await db.store.findFirst()

    // Get top products for preview
    const productSales = new Map()
    sales.forEach(sale => {
      sale.saleItems.forEach(item => {
        const productName = item.product.name
        const current = productSales.get(productName) || 0
        productSales.set(productName, current + item.quantity)
      })
    })

    const topProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }))

    const summary = {
      date: yesterday.toISOString().split('T')[0],
      totalSales,
      transactionCount,
      averageTransaction,
      topProducts,
      storeName: store?.name || 'POS System',
      settings: {
        enabled: settings?.triggers?.dailySalesSummary?.enabled,
        recipients: settings?.triggers?.dailySalesSummary?.recipients || [],
        time: settings?.triggers?.dailySalesSummary?.time,
        template: settings?.triggers?.dailySalesSummary?.template
      }
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching daily sales summary status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily sales summary status' },
      { status: 500 }
    )
  }
}