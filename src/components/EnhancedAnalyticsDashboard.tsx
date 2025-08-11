"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from '@/components/ui/chart'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  Funnel,
  Tooltip
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Clock,
  Target,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Eye,
  Star,
  Brain
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

interface RealTimeMetrics {
  totalRevenue: number
  todaySales: number
  activeCustomers: number
  conversionRate: number
  averageOrderValue: number
  inventoryTurnover: number
  customerSatisfaction: number
  employeePerformance: number
}

interface SalesTrend {
  hour: string
  revenue: number
  transactions: number
  customers: number
}

interface ProductPerformance {
  name: string
  revenue: number
  quantity: number
  growth: number
  category: string
  rating: number
}

interface CustomerSegment {
  segment: string
  customers: number
  revenue: number
  growth: number
  satisfaction: number
}

interface StorePerformance {
  store: string
  revenue: number
  transactions: number
  customers: number
  satisfaction: number
  growth: number
}

interface PredictiveInsight {
  id: string
  type: string
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  timeframe: string
  actionItems: string[]
}

export default function EnhancedAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    totalRevenue: 0,
    todaySales: 0,
    activeCustomers: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    inventoryTurnover: 0,
    customerSatisfaction: 0,
    employeePerformance: 0
  })
  
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([])
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([])
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([])
  const [storePerformance, setStorePerformance] = useState<StorePerformance[]>([])
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([])
  const [timeRange, setTimeRange] = useState('today')
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalyticsData()
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Fetch real-time metrics
      const metricsResponse = await fetch('/api/analytics/metrics')
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }

      // Fetch sales trends
      const trendsResponse = await fetch(`/api/analytics/trends?range=${timeRange}`)
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        setSalesTrends(trendsData)
      }

      // Fetch product performance
      const productsResponse = await fetch('/api/analytics/products')
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProductPerformance(productsData)
      }

      // Fetch customer segments
      const segmentsResponse = await fetch('/api/analytics/segments')
      if (segmentsResponse.ok) {
        const segmentsData = await segmentsResponse.json()
        setCustomerSegments(segmentsData)
      }

      // Fetch store performance
      const storesResponse = await fetch('/api/analytics/stores')
      if (storesResponse.ok) {
        const storesData = await storesResponse.json()
        setStorePerformance(storesData)
      }

      // Fetch predictive insights
      const insightsResponse = await fetch('/api/analytics/insights')
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        setPredictiveInsights(insightsData)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      // Use mock data for demo
      setMockData()
    } finally {
      setLoading(false)
    }
  }

  const setMockData = () => {
    // Mock real-time metrics
    setMetrics({
      totalRevenue: 15420.50,
      todaySales: 2847.00,
      activeCustomers: 47,
      conversionRate: 23.5,
      averageOrderValue: 45.80,
      inventoryTurnover: 8.2,
      customerSatisfaction: 4.6,
      employeePerformance: 87.3
    })

    // Mock sales trends
    const mockTrends: SalesTrend[] = []
    for (let i = 0; i < 24; i++) {
      mockTrends.push({
        hour: `${i}:00`,
        revenue: Math.random() * 500 + 100,
        transactions: Math.floor(Math.random() * 20) + 5,
        customers: Math.floor(Math.random() * 15) + 3
      })
    }
    setSalesTrends(mockTrends)

    // Mock product performance
    setProductPerformance([
      { name: 'Coffee', revenue: 1250, quantity: 357, growth: 12.5, category: 'Beverages', rating: 4.8 },
      { name: 'Sandwich', revenue: 980, quantity: 109, growth: 8.3, category: 'Food', rating: 4.6 },
      { name: 'Soda', revenue: 750, quantity: 300, growth: -2.1, category: 'Beverages', rating: 4.2 },
      { name: 'Chips', revenue: 620, quantity: 207, growth: 15.7, category: 'Snacks', rating: 4.4 },
      { name: 'Water Bottle', revenue: 450, quantity: 300, growth: 5.2, category: 'Beverages', rating: 4.1 },
      { name: 'Cookie', revenue: 380, quantity: 169, growth: 22.1, category: 'Snacks', rating: 4.9 }
    ])

    // Mock customer segments
    setCustomerSegments([
      { segment: 'Regular', customers: 156, revenue: 12450, growth: 18.2, satisfaction: 4.7 },
      { segment: 'Premium', customers: 42, revenue: 8900, growth: 25.6, satisfaction: 4.9 },
      { segment: 'Occasional', customers: 289, revenue: 5600, growth: -5.3, satisfaction: 3.8 },
      { segment: 'New', customers: 78, revenue: 1200, growth: 45.2, satisfaction: 4.2 }
    ])

    // Mock store performance
    setStorePerformance([
      { store: 'Main Store', revenue: 8450, transactions: 184, customers: 147, satisfaction: 4.6, growth: 12.3 },
      { store: 'Downtown', revenue: 6200, transactions: 135, customers: 108, satisfaction: 4.4, growth: 8.7 },
      { store: 'Mall Branch', revenue: 4100, transactions: 89, customers: 71, satisfaction: 4.8, growth: 15.2 }
    ])

    // Mock predictive insights
    setPredictiveInsights([
      {
        id: '1',
        type: 'opportunity',
        title: 'High Demand for Coffee Products',
        description: 'Coffee sales are trending 35% higher than usual. Consider increasing inventory.',
        confidence: 92,
        impact: 'high',
        timeframe: 'Next 7 days',
        actionItems: ['Increase coffee inventory by 50%', 'Promote coffee bundles', 'Staff training for peak hours']
      },
      {
        id: '2',
        type: 'warning',
        title: 'Declining Customer Satisfaction',
        description: 'Customer satisfaction scores have dropped 12% in the last 30 days.',
        confidence: 78,
        impact: 'medium',
        timeframe: 'Next 30 days',
        actionItems: ['Review customer feedback', 'Improve service quality', 'Implement loyalty rewards']
      },
      {
        id: '3',
        type: 'trend',
        title: 'Weekend Sales Growth',
        description: 'Weekend sales are growing 25% faster than weekdays.',
        confidence: 85,
        impact: 'medium',
        timeframe: 'Ongoing',
        actionItems: ['Optimize weekend staffing', 'Create weekend promotions', 'Extend weekend hours']
      }
    ])
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time business intelligence and predictive insights</p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalyticsData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatPrice(metrics.totalRevenue)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold">{formatPrice(metrics.todaySales)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+8.3%</span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold">{metrics.activeCustomers}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+15.2%</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+3.2%</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">Sales Trends</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="transactions" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, revenue }) => `${segment}: ${formatPrice(revenue)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerSegments.map((segment, index) => (
                    <div key={segment.segment} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{segment.segment}</span>
                        <span className="text-sm text-gray-600">{segment.satisfaction}/5.0</span>
                      </div>
                      <Progress value={segment.satisfaction * 20} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {predictiveInsights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      {insight.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact.toUpperCase()} IMPACT
                      </Badge>
                      <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{insight.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Timeframe: {insight.timeframe}</span>
                    <Badge variant="outline">{insight.type}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Recommended Actions:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {insight.actionItems.map((action, index) => (
                        <li key={index} className="text-sm text-gray-600">{action}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={storePerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="store" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Revenue"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Order Value</span>
                      <span className="text-sm text-gray-600">{formatPrice(metrics.averageOrderValue)}</span>
                    </div>
                    <Progress value={(metrics.averageOrderValue / 100) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Inventory Turnover</span>
                      <span className="text-sm text-gray-600">{metrics.inventoryTurnover}x</span>
                    </div>
                    <Progress value={(metrics.inventoryTurnover / 15) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Customer Satisfaction</span>
                      <span className="text-sm text-gray-600">{metrics.customerSatisfaction}/5.0</span>
                    </div>
                    <Progress value={(metrics.customerSatisfaction / 5) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Employee Performance</span>
                      <span className="text-sm text-gray-600">{metrics.employeePerformance}%</span>
                    </div>
                    <Progress value={metrics.employeePerformance} className="h-2" />
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