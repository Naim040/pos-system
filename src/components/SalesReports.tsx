"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  Area
} from 'recharts'
import { 
  Calendar, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Download, 
  Search, 
  Package, 
  Receipt,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

interface Sale {
  id: string
  totalAmount: number
  taxAmount: number
  discount: number
  status: string
  paymentMethod: string
  customerName?: string
  customerEmail?: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  saleItems: {
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    product: {
      id: string
      name: string
      price: number
      category?: {
        name: string
      }
    }
  }[]
}

interface ChartData {
  date: string
  sales: number
  revenue: number
  transactions: number
}

interface ProductPerformance {
  name: string
  revenue: number
  quantity: number
  category?: string
}

interface CustomerAnalytics {
  name: string
  totalSpent: number
  transactionCount: number
  averageOrderValue: number
}

export default function SalesReports() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('month')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [chartType, setChartType] = useState('revenue')
  const { toast } = useToast()

  useEffect(() => {
    fetchSales()
  }, [])

  useEffect(() => {
    filterSales()
  }, [sales, searchTerm, dateFilter, paymentMethodFilter, statusFilter])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load sales data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterSales = () => {
    let filtered = sales

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.saleItems.some(item => 
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const startDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(sale => 
        new Date(sale.createdAt) >= startDate
      )
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentMethodFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter)
    }

    setFilteredSales(filtered)
  }

  const calculateStats = () => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalTax = filteredSales.reduce((sum, sale) => sum + sale.taxAmount, 0)
    const totalRevenue = totalSales + totalTax
    const averageSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0
    const totalItems = filteredSales.reduce((sum, sale) => 
      sum + sale.saleItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )

    // Calculate growth (compare with previous period)
    const now = new Date()
    const currentPeriodStart = new Date()
    const previousPeriodStart = new Date()
    const previousPeriodEnd = new Date()

    switch (dateFilter) {
      case 'today':
        currentPeriodStart.setHours(0, 0, 0, 0)
        previousPeriodStart.setDate(now.getDate() - 1)
        previousPeriodStart.setHours(0, 0, 0, 0)
        previousPeriodEnd.setDate(now.getDate() - 1)
        previousPeriodEnd.setHours(23, 59, 59, 999)
        break
      case 'week':
        currentPeriodStart.setDate(now.getDate() - 7)
        previousPeriodStart.setDate(now.getDate() - 14)
        previousPeriodEnd.setDate(now.getDate() - 7)
        break
      case 'month':
        currentPeriodStart.setMonth(now.getMonth() - 1)
        previousPeriodStart.setMonth(now.getMonth() - 2)
        previousPeriodEnd.setMonth(now.getMonth() - 1)
        break
      default:
        previousPeriodStart.setMonth(now.getMonth() - 2)
        previousPeriodEnd.setMonth(now.getMonth() - 1)
    }

    const currentPeriodSales = sales.filter(sale => 
      new Date(sale.createdAt) >= currentPeriodStart
    )
    const previousPeriodSales = sales.filter(sale => 
      new Date(sale.createdAt) >= previousPeriodStart && 
      new Date(sale.createdAt) < previousPeriodEnd
    )

    const currentRevenue = currentPeriodSales.reduce((sum, sale) => sum + sale.totalAmount + sale.taxAmount, 0)
    const previousRevenue = previousPeriodSales.reduce((sum, sale) => sum + sale.totalAmount + sale.taxAmount, 0)
    const growthRate = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

    return {
      totalSales,
      totalTax,
      totalRevenue,
      averageSale,
      totalItems,
      saleCount: filteredSales.length,
      growthRate
    }
  }

  const stats = calculateStats()

  const generateChartData = (): ChartData[] => {
    const data: { [key: string]: ChartData } = {}
    
    filteredSales.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString()
      if (!data[date]) {
        data[date] = {
          date,
          sales: 0,
          revenue: 0,
          transactions: 0
        }
      }
      data[date].sales += sale.totalAmount
      data[date].revenue += sale.totalAmount + sale.taxAmount
      data[date].transactions += 1
    })

    return Object.values(data).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const generateProductPerformance = (): ProductPerformance[] => {
    const productData: { [key: string]: ProductPerformance } = {}
    
    filteredSales.forEach(sale => {
      sale.saleItems.forEach(item => {
        const key = item.product.name
        if (!productData[key]) {
          productData[key] = {
            name: item.product.name,
            revenue: 0,
            quantity: 0,
            category: item.product.category?.name
          }
        }
        productData[key].revenue += item.totalPrice
        productData[key].quantity += item.quantity
      })
    })

    return Object.values(productData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 products
  }

  const generateCustomerAnalytics = (): CustomerAnalytics[] => {
    const customerData: { [key: string]: CustomerAnalytics } = {}
    
    filteredSales.forEach(sale => {
      if (sale.customerName) {
        const key = sale.customerName
        if (!customerData[key]) {
          customerData[key] = {
            name: sale.customerName,
            totalSpent: 0,
            transactionCount: 0,
            averageOrderValue: 0
          }
        }
        customerData[key].totalSpent += sale.totalAmount + sale.taxAmount
        customerData[key].transactionCount += 1
      }
    })

    // Calculate average order value
    Object.values(customerData).forEach(customer => {
      customer.averageOrderValue = customer.totalSpent / customer.transactionCount
    })

    return Object.values(customerData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10) // Top 10 customers
  }

  const generatePaymentMethodData = () => {
    const paymentData: { [key: string]: { count: number; amount: number } } = {
      cash: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      mobile: { count: 0, amount: 0 }
    }

    filteredSales.forEach(sale => {
      if (paymentData[sale.paymentMethod]) {
        paymentData[sale.paymentMethod].count += 1
        paymentData[sale.paymentMethod].amount += sale.totalAmount + sale.taxAmount
      }
    })

    return Object.entries(paymentData).map(([method, data]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: data.amount,
      count: data.count
    }))
  }

  const chartData = generateChartData()
  const productPerformance = generateProductPerformance()
  const customerAnalytics = generateCustomerAnalytics()
  const paymentMethodData = generatePaymentMethodData()

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    sales: {
      label: "Sales",
      color: "hsl(var(--chart-2))",
    },
    transactions: {
      label: "Transactions",
      color: "hsl(var(--chart-3))",
    },
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const exportToCSV = () => {
    const headers = ['Sale ID', 'Date', 'Customer', 'Payment Method', 'Items', 'Subtotal', 'Tax', 'Total']
    const csvData = filteredSales.map(sale => [
      sale.id,
      new Date(sale.createdAt).toLocaleDateString(),
      sale.customerName || 'Walk-in',
      sale.paymentMethod,
      sale.saleItems.length,
      sale.totalAmount.toFixed(2),
      sale.taxAmount.toFixed(2),
      (sale.totalAmount + sale.taxAmount).toFixed(2)
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: "Sales data exported to CSV",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sales Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive sales analysis with interactive charts</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchSales} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">{stats.saleCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Sale</p>
                <p className="text-2xl font-bold">{formatPrice(stats.averageSale)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Items Sold</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tax Collected</p>
                <p className="text-2xl font-bold">{formatPrice(stats.totalTax)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              {stats.growthRate >= 0 ? (
                <ArrowUpRight className="h-8 w-8 text-green-600" />
              ) : (
                <ArrowDownRight className="h-8 w-8 text-red-600" />
              )}
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className={`text-2xl font-bold ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.growthRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search sales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment">Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Sales Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="transactions">Transactions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey={chartType}
                      stroke={chartConfig[chartType as keyof typeof chartConfig].color}
                      strokeWidth={2}
                      dot={{ fill: chartConfig[chartType as keyof typeof chartConfig].color }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke={chartConfig.revenue.color}
                      fill={chartConfig.revenue.color}
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stackId="2"
                      stroke={chartConfig.sales.color}
                      fill={chartConfig.sales.color}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="revenue" fill={chartConfig.revenue.color} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Sales Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {productPerformance.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-600">
                          {product.category} • {product.quantity} units sold
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(product.revenue)}</p>
                        <p className="text-sm text-gray-600">
                          {formatPrice(product.revenue / product.quantity)} per unit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="totalSpent" fill={chartConfig.revenue.color} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {customerAnalytics.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{customer.name}</h4>
                        <p className="text-sm text-gray-600">
                          {customer.transactionCount} transactions • 
                          {formatPrice(customer.averageOrderValue)} avg order
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(customer.totalSpent)}</p>
                        <p className="text-sm text-gray-600">Total spent</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {paymentMethodData.map((method, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <h4 className="font-semibold">{method.name}</h4>
                        <p className="text-2xl font-bold">{formatPrice(method.value)}</p>
                        <p className="text-sm text-gray-600">{method.count} transactions</p>
                        <Badge variant="outline" className="mt-2">
                          {((method.value / paymentMethodData.reduce((sum, m) => sum + m.value, 0)) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}