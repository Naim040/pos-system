"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Package, 
  Target, 
  Brain,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'

interface MetricCard {
  title: string
  value: string
  change: number
  trend: 'up' | 'down'
  icon: React.ReactNode
  description: string
}

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

interface ForecastData {
  period: string
  predicted: number
  confidence: number
}

interface CustomerSegment {
  name: string
  count: number
  revenue: number
  growth: number
  color: string
}

export default function AdvancedAnalytics() {
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [forecasts, setForecasts] = useState<ForecastData[]>([])
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Load metrics
      const metricsResponse = await fetch(`/api/analytics/metrics?range=${timeRange}`)
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      } else {
        // Mock data for demo
        setMetrics([
          {
            title: "Total Revenue",
            value: "$45,231",
            change: 12.5,
            trend: "up",
            icon: <DollarSign className="h-4 w-4" />,
            description: "vs previous period"
          },
          {
            title: "Active Customers",
            value: "1,234",
            change: 8.2,
            trend: "up",
            icon: <Users className="h-4 w-4" />,
            description: "vs previous period"
          },
          {
            title: "Average Order Value",
            value: "$67.89",
            change: -2.1,
            trend: "down",
            icon: <ShoppingCart className="h-4 w-4" />,
            description: "vs previous period"
          },
          {
            title: "Inventory Turnover",
            value: "4.2x",
            change: 15.3,
            trend: "up",
            icon: <Package className="h-4 w-4" />,
            description: "vs previous period"
          }
        ])
      }

      // Load AI insights
      const insightsResponse = await fetch('/api/analytics/insights')
      if (insightsResponse.ok) {
        const insightsData = await insightsData.json()
        setInsights(insightsData)
      } else {
        // Mock insights for demo
        setInsights([
          {
            id: "1",
            type: "opportunity",
            title: "High-Value Customer Segment Identified",
            description: "Customers spending $100+ show 40% higher retention rate. Consider targeted loyalty program.",
            impact: "high",
            confidence: 85,
            actionable: true,
            timestamp: new Date().toISOString()
          },
          {
            id: "2",
            type: "warning",
            title: "Seasonal Demand Drop Expected",
            description: "Historical data indicates 15% sales decline in next 2 weeks. Adjust inventory accordingly.",
            impact: "medium",
            confidence: 72,
            actionable: true,
            timestamp: new Date().toISOString()
          },
          {
            id: "3",
            type: "trend",
            title: "Mobile Payments Growing 25% Monthly",
            description: "Customer preference shifting towards mobile payment methods. Consider optimizing checkout flow.",
            impact: "medium",
            confidence: 90,
            actionable: true,
            timestamp: new Date().toISOString()
          },
          {
            id: "4",
            type: "recommendation",
            title: "Optimize Staffing During Peak Hours",
            description: "Peak traffic between 2-4 PM. Add 1-2 staff members during this period to improve service.",
            impact: "low",
            confidence: 78,
            actionable: true,
            timestamp: new Date().toISOString()
          }
        ])
      }

      // Load forecast data
      const forecastResponse = await fetch('/api/analytics/forecast')
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json()
        setForecasts(forecastData)
      } else {
        // Mock forecast data
        setForecasts([
          { period: "Week 1", predicted: 5200, confidence: 85 },
          { period: "Week 2", predicted: 4800, confidence: 82 },
          { period: "Week 3", predicted: 5100, confidence: 78 },
          { period: "Week 4", predicted: 5500, confidence: 75 }
        ])
      }

      // Load customer segments
      const segmentsResponse = await fetch('/api/analytics/segments')
      if (segmentsResponse.ok) {
        const segmentsData = await segmentsResponse.json()
        setSegments(segmentsData)
      } else {
        // Mock segments data
        setSegments([
          { name: "VIP Customers", count: 156, revenue: 28500, growth: 12.5, color: "#8B5CF6" },
          { name: "Regular Customers", count: 423, revenue: 18900, growth: 8.3, color: "#3B82F6" },
          { name: "Occasional Buyers", count: 655, revenue: 12400, growth: -2.1, color: "#10B981" },
          { name: "New Customers", count: 234, revenue: 8900, growth: 45.2, color: "#F59E0B" }
        ])
      }
    } catch (error) {
      console.error('Error loading analytics data:', error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated",
    })
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'recommendation':
        return <Brain className="h-5 w-5 text-purple-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">AI-powered business intelligence and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
                <span>{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Forecasting
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            Customer Segments
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI-Powered Business Insights
              </CardTitle>
              <CardDescription>
                Intelligent analysis of your business data with actionable recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <Card key={insight.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {getInsightIcon(insight.type)}
                            <div>
                              <CardTitle className="text-lg">{insight.title}</CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className={getImpactColor(insight.impact)}>
                                  {insight.impact} impact
                                </Badge>
                                <Badge variant="outline">
                                  {insight.confidence}% confidence
                                </Badge>
                                {insight.actionable && (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    Actionable
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(insight.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{insight.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Progress value={insight.confidence} className="w-20" />
                            <span className="text-sm text-gray-600">AI Confidence</span>
                          </div>
                          {insight.actionable && (
                            <Button size="sm" variant="outline">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>AI-powered sales predictions for the next 4 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecasts.map((forecast, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{forecast.period}</p>
                        <p className="text-sm text-gray-600">Predicted Revenue</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(forecast.predicted)}</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={forecast.confidence} className="w-16" />
                          <span className="text-sm text-gray-600">{forecast.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forecast Accuracy</CardTitle>
                <CardDescription>Historical accuracy of AI predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">87.3%</div>
                    <p className="text-gray-600">Overall Forecast Accuracy</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Revenue Predictions</span>
                      <span className="font-medium">89.2%</span>
                    </div>
                    <Progress value={89.2} />
                    <div className="flex justify-between">
                      <span>Customer Behavior</span>
                      <span className="font-medium">85.7%</span>
                    </div>
                    <Progress value={85.7} />
                    <div className="flex justify-between">
                      <span>Inventory Needs</span>
                      <span className="font-medium">86.9%</span>
                    </div>
                    <Progress value={86.9} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segmentation Analysis</CardTitle>
              <CardDescription>AI-powered customer grouping based on behavior and value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {segments.map((segment, index) => (
                  <Card key={index} className="border-l-4" style={{ borderLeftColor: segment.color }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                        <Badge variant="outline">
                          {segment.count} customers
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenue</span>
                          <span className="font-bold">{formatCurrency(segment.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Growth</span>
                          <span className={`font-medium ${segment.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {segment.growth > 0 ? '+' : ''}{segment.growth}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={Math.abs(segment.growth)} className="flex-1" />
                          <span className="text-sm text-gray-600">{Math.abs(segment.growth)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Health Score</CardTitle>
                <CardDescription>Overall business performance indicator</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold text-green-600">8.4</div>
                  <p className="text-gray-600">Out of 10</p>
                  <Progress value={84} className="w-full" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-green-600">+12%</div>
                      <div className="text-gray-600">vs last month</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">Top 15%</div>
                      <div className="text-gray-600">Industry benchmark</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Real-time business metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Customer Satisfaction</span>
                    </div>
                    <span className="font-bold text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <span>Employee Productivity</span>
                    </div>
                    <span className="font-bold text-blue-600">87%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      <span>Goal Achievement</span>
                    </div>
                    <span className="font-bold text-purple-600">92%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span>Response Time</span>
                    </div>
                    <span className="font-bold text-yellow-600">2.3 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}