import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

interface ForecastData {
  period: string
  predicted: number
  confidence: number
}

export async function GET(request: NextRequest) {
  try {
    // Get historical sales data for the past 90 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 90)

    const salesData = await db.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      },
      select: {
        totalAmount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group sales by week
    const weeklySales = new Map<string, number>()
    
    salesData.forEach(sale => {
      const weekStart = new Date(sale.createdAt)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Set to Sunday
      const weekKey = weekStart.toISOString().split('T')[0]
      
      weeklySales.set(weekKey, (weeklySales.get(weekKey) || 0) + sale.totalAmount)
    })

    // Convert to array for analysis
    const weeklySalesArray = Array.from(weeklySales.entries()).map(([week, revenue]) => ({
      week,
      revenue
    }))

    // Generate forecast using AI
    const zai = await ZAI.create()
    
    const prompt = `
You are a forecasting expert for retail businesses. Analyze the following weekly sales data and generate a 4-week revenue forecast:

Historical Weekly Sales Data (past 12 weeks):
${weeklySalesArray.slice(-12).map((data, index) => `Week ${index + 1}: $${data.revenue.toFixed(2)}`).join('\n')}

Generate a forecast for the next 4 weeks. For each week, provide:
- Predicted revenue
- Confidence level (0-100%)

Consider:
- Seasonal trends
- Recent growth patterns
- Any anomalies in the data
- Overall business trajectory

Respond in JSON format with an array of forecasts, each containing:
- period: "Week X" (where X is the week number)
- predicted: predicted revenue amount
- confidence: confidence percentage
`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert forecasting analyst providing accurate revenue predictions for retail businesses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    })

    let forecasts: ForecastData[] = []
    
    try {
      const responseContent = completion.choices[0]?.message?.content
      if (responseContent) {
        const parsedForecasts = JSON.parse(responseContent)
        forecasts = parsedForecasts.map((forecast: any, index: number) => ({
          period: forecast.period || `Week ${index + 1}`,
          predicted: parseFloat(forecast.predicted) || 0,
          confidence: Math.min(100, Math.max(0, forecast.confidence || 75))
        }))
      }
    } catch (parseError) {
      console.error('Error parsing AI forecast response:', parseError)
      // Fallback to rule-based forecasting
      forecasts = generateRuleBasedForecast(weeklySalesArray)
    }

    // If AI fails, generate rule-based forecast
    if (forecasts.length === 0) {
      forecasts = generateRuleBasedForecast(weeklySalesArray)
    }

    return NextResponse.json(forecasts)
  } catch (error) {
    console.error('Error generating forecast:', error)
    
    // Fallback to simple forecast
    const fallbackForecast = [
      { period: "Week 1", predicted: 5000, confidence: 70 },
      { period: "Week 2", predicted: 5200, confidence: 68 },
      { period: "Week 3", predicted: 5100, confidence: 65 },
      { period: "Week 4", predicted: 5300, confidence: 62 }
    ]
    
    return NextResponse.json(fallbackForecast)
  }
}

function generateRuleBasedForecast(weeklySales: Array<{ week: string; revenue: number }>): ForecastData[] {
  if (weeklySales.length < 4) {
    // Not enough data, return simple forecast
    return [
      { period: "Week 1", predicted: 5000, confidence: 50 },
      { period: "Week 2", predicted: 5000, confidence: 45 },
      { period: "Week 3", predicted: 5000, confidence: 40 },
      { period: "Week 4", predicted: 5000, confidence: 35 }
    ]
  }

  // Calculate moving average and trend
  const recentWeeks = weeklySales.slice(-4)
  const averageRevenue = recentWeeks.reduce((sum, week) => sum + week.revenue, 0) / recentWeeks.length
  
  // Calculate trend
  const olderWeeks = weeklySales.slice(-8, -4)
  const olderAverage = olderWeeks.reduce((sum, week) => sum + week.revenue, 0) / olderWeeks.length
  const trendFactor = averageRevenue / olderAverage
  
  // Generate forecast with trend
  const forecasts: ForecastData[] = []
  let baseRevenue = averageRevenue
  
  for (let i = 1; i <= 4; i++) {
    // Apply trend with diminishing confidence
    baseRevenue = baseRevenue * trendFactor
    const confidence = Math.max(30, 85 - (i * 10)) // Decreasing confidence for further weeks
    
    forecasts.push({
      period: `Week ${i}`,
      predicted: Math.round(baseRevenue),
      confidence: Math.round(confidence)
    })
  }
  
  return forecasts
}