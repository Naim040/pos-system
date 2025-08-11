import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'trend' | 'recommendation'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  actionable: boolean
  timestamp: string
}

export async function GET(request: NextRequest) {
  try {
    // Get recent business data for analysis
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)

    // Get sales data
    const salesData = await db.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      },
      include: {
        customer: true,
        saleItems: {
          include: {
            product: true
          }
        }
      }
    })

    // Get customer data
    const customers = await db.customer.findMany({
      include: {
        sales: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    // Get inventory data
    const inventory = await db.inventory.findMany({
      include: {
        product: true,
        stockMovements: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    // Generate insights using AI
    const zai = await ZAI.create()
    
    // Prepare data for AI analysis
    const businessContext = {
      totalSales: salesData.length,
      totalRevenue: salesData.reduce((sum, sale) => sum + sale.totalAmount, 0),
      averageOrderValue: salesData.length > 0 ? salesData.reduce((sum, sale) => sum + sale.totalAmount, 0) / salesData.length : 0,
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.sales.length > 0).length,
      lowStockItems: inventory.filter(item => item.quantity <= item.minStock).length,
      outOfStockItems: inventory.filter(item => item.quantity === 0).length,
      topProducts: salesData
        .flatMap(sale => sale.saleItems)
        .reduce((acc, item) => {
          const existing = acc.find(i => i.productId === item.productId)
          if (existing) {
            existing.quantity += item.quantity
            existing.revenue += item.totalPrice
          } else {
            acc.push({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              revenue: item.totalPrice
            })
          }
          return acc
        }, [] as any[])
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    }

    // Generate AI insights
    const prompt = `
You are an expert business analyst for a retail POS system. Analyze the following business data and provide actionable insights:

Business Context:
- Total Sales: ${businessContext.totalSales}
- Total Revenue: $${businessContext.totalRevenue.toFixed(2)}
- Average Order Value: $${businessContext.averageOrderValue.toFixed(2)}
- Total Customers: ${businessContext.totalCustomers}
- Active Customers: ${businessContext.activeCustomers}
- Low Stock Items: ${businessContext.lowStockItems}
- Out of Stock Items: ${businessContext.outOfStockItems}

Top Products by Revenue:
${businessContext.topProducts.map((p: any) => `- ${p.productName}: $${p.revenue.toFixed(2)} (${p.quantity} units)`).join('\n')}

Generate 4 different types of insights:
1. An opportunity insight (high-value business opportunity)
2. A warning insight (potential risk or issue)
3. A trend insight (emerging pattern or behavior)
4. A recommendation insight (specific action to take)

For each insight, provide:
- A clear, concise title
- A detailed description explaining the insight
- Impact level (high, medium, low)
- Confidence level (0-100%)
- Whether it's actionable (true/false)

Respond in JSON format with an array of insights.
`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert business analyst providing data-driven insights for retail businesses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    let insights: AIInsight[] = []
    
    try {
      const responseContent = completion.choices[0]?.message?.content
      if (responseContent) {
        const parsedInsights = JSON.parse(responseContent)
        insights = parsedInsights.map((insight: any, index: number) => ({
          id: `insight-${Date.now()}-${index}`,
          type: insight.type || 'recommendation',
          title: insight.title || 'Business Insight',
          description: insight.description || 'No description available',
          impact: insight.impact || 'medium',
          confidence: Math.min(100, Math.max(0, insight.confidence || 75)),
          actionable: insight.actionable !== false,
          timestamp: new Date().toISOString()
        }))
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Fallback to rule-based insights
      insights = generateRuleBasedInsights(businessContext)
    }

    // If AI fails, generate rule-based insights
    if (insights.length === 0) {
      insights = generateRuleBasedInsights(businessContext)
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Error generating AI insights:', error)
    
    // Fallback to basic rule-based insights
    const fallbackInsights = generateRuleBasedInsights({
      totalSales: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalCustomers: 0,
      activeCustomers: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      topProducts: []
    })
    
    return NextResponse.json(fallbackInsights)
  }
}

function generateRuleBasedInsights(context: any): AIInsight[] {
  const insights: AIInsight[] = []

  // Low stock warning
  if (context.lowStockItems > 0) {
    insights.push({
      id: `insight-${Date.now()}-1`,
      type: 'warning',
      title: 'Low Stock Items Detected',
      description: `${context.lowStockItems} items are running low on stock. Consider reordering soon to avoid stockouts.`,
      impact: context.lowStockItems > 5 ? 'high' : 'medium',
      confidence: 90,
      actionable: true,
      timestamp: new Date().toISOString()
    })
  }

  // Out of stock alert
  if (context.outOfStockItems > 0) {
    insights.push({
      id: `insight-${Date.now()}-2`,
      type: 'warning',
      title: 'Items Out of Stock',
      description: `${context.outOfStockItems} items are completely out of stock. This may be causing lost sales opportunities.`,
      impact: 'high',
      confidence: 95,
      actionable: true,
      timestamp: new Date().toISOString()
    })
  }

  // Customer activity insight
  if (context.totalCustomers > 0) {
    const customerActivityRate = (context.activeCustomers / context.totalCustomers) * 100
    if (customerActivityRate < 30) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        type: 'opportunity',
        title: 'Low Customer Engagement',
        description: `Only ${customerActivityRate.toFixed(1)}% of customers made purchases recently. Consider running promotions to re-engage inactive customers.`,
        impact: 'medium',
        confidence: 80,
        actionable: true,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Revenue optimization
  if (context.averageOrderValue < 50) {
    insights.push({
      id: `insight-${Date.now()}-4`,
      type: 'recommendation',
      title: 'Increase Average Order Value',
      description: `Current average order value is $${context.averageOrderValue.toFixed(2)}. Consider upselling strategies or bundle deals to increase this metric.`,
      impact: 'medium',
      confidence: 75,
      actionable: true,
      timestamp: new Date().toISOString()
    })
  }

  return insights
}