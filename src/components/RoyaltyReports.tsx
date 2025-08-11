"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  AlertTriangle, 
  Download, 
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  RefreshCw
} from 'lucide-react'

interface ReportData {
  summary: {
    totalFranchises: number
    activeFranchises: number
    totalClients: number
    totalRevenue: number
    totalOutstanding: number
    monthlyRecurringRevenue: number
    collectionRate: number
  }
  paymentStats: any
  overduePayments: any[]
}

interface RevenueData {
  totalRevenue: number
  totalPayments: number
  revenueByType: any
  monthlyRevenue: any
  topFranchises: any[]
}

interface OutstandingData {
  totalOutstanding: number
  totalOutstandingPayments: number
  outstandingByStatus: any
  outstandingByFranchise: any[]
  overdueByAge: any
}

interface PerformanceData {
  overallMetrics: any
  franchisePerformance: any[]
  topPerformers: any[]
  needsAttention: any[]
}

export default function RoyaltyReports() {
  const { user, hasRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({
    reportType: 'overview',
    startDate: '',
    endDate: '',
    franchiseId: '',
    status: ''
  })

  const [reportData, setReportData] = useState<{
    overview: ReportData | null
    revenue: RevenueData | null
    outstanding: OutstandingData | null
    performance: PerformanceData | null
  }>({
    overview: null,
    revenue: null,
    outstanding: null,
    performance: null
  })

  const [franchises, setFranchises] = useState<any[]>([])

  useEffect(() => {
    if (hasRole('admin')) {
      fetchFranchises()
      fetchReportData()
    }
  }, [hasRole])

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/franchise/manage')
      if (response.ok) {
        const data = await response.json()
        setFranchises(data.franchises || [])
      }
    } catch (error) {
      console.error('Error fetching franchises:', error)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value)
      })

      // Fetch all report types
      const [overview, revenue, outstanding, performance] = await Promise.all([
        fetch(`/api/royalty/reports?type=overview&${params.toString()}`),
        fetch(`/api/royalty/reports?type=revenue&${params.toString()}`),
        fetch(`/api/royalty/reports?type=outstanding&${params.toString()}`),
        fetch(`/api/royalty/reports?type=franchise-performance&${params.toString()}`)
      ])

      const [overviewData, revenueData, outstandingData, performanceData] = await Promise.all([
        overview.json(),
        revenue.json(),
        outstanding.json(),
        performance.json()
      ])

      setReportData({
        overview: overviewData,
        revenue: revenueData,
        outstanding: outstandingData,
        performance: performanceData
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value)
      })
      params.append('format', format)

      const response = await fetch(`/api/royalty/reports/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `royalty-report-${filters.reportType}-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access royalty reports. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Royalty Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and reporting for franchise royalties
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchReportData}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select onValueChange={(value) => exportReport(value as 'csv' | 'excel' | 'pdf')}>
            <SelectTrigger className="w-32">
              <Download className="mr-2 h-4 w-4" />
              Export
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select 
                value={filters.reportType} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="outstanding">Outstanding</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Franchise</Label>
              <Select 
                value={filters.franchiseId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, franchiseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All franchises" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All franchises</SelectItem>
                  {franchises.map(franchise => (
                    <SelectItem key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={fetchReportData} disabled={loading}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData.overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(reportData.overview.summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${reportData.overview.summary.totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(reportData.overview.summary.totalOutstanding)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(reportData.overview.summary.collectionRate)} collection rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Franchises</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.overview.summary.activeFranchises}</div>
              <p className="text-xs text-muted-foreground">
                of {reportData.overview.summary.totalFranchises} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly MRR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(reportData.overview.summary.monthlyRecurringRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Recurring revenue
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Reports */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Payments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Statistics</CardTitle>
              <CardDescription>
                Breakdown of royalty payments by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.overview && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.overview.paymentStats).map(([status, stats]: [string, any]) => (
                    <div key={status} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{formatCurrency(stats.amount)}</div>
                      <div className="text-sm text-muted-foreground mb-2">{stats.count} payments</div>
                      {getStatusBadge(status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overdue Payments</CardTitle>
              <CardDescription>
                Franchises with overdue royalty payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.overview && reportData.overview.overduePayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.overview.overduePayments.map((payment) => {
                      const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.franchise.name}</TableCell>
                          <TableCell>{payment.franchise.email}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{daysOverdue} days</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Send Reminder
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No overdue payments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Type</CardTitle>
              <CardDescription>
                Breakdown of revenue by payment type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.revenue && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(reportData.revenue.revenueByType).map(([type, stats]: [string, any]) => (
                    <div key={type} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{formatCurrency(stats.amount)}</div>
                      <div className="text-sm text-muted-foreground mb-2">{stats.count} payments</div>
                      <Badge variant="outline" className="capitalize">{type.replace('_', ' ')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Franchises</CardTitle>
              <CardDescription>
                Franchises ranked by total revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.revenue && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Clients</TableHead>
                      <TableHead>Avg Revenue/Client</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.revenue.topFranchises.map((franchise, index) => (
                      <TableRow key={franchise.id}>
                        <TableCell>
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{franchise.name}</TableCell>
                        <TableCell>{formatCurrency(franchise.revenue)}</TableCell>
                        <TableCell>{franchise.clients}</TableCell>
                        <TableCell>{formatCurrency(franchise.avgRevenuePerClient)}</TableCell>
                        <TableCell>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding by Age</CardTitle>
              <CardDescription>
                Breakdown of overdue payments by age
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.outstanding && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.outstanding.overdueByAge).map(([age, amount]: [string, any]) => (
                    <div key={age} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(amount)}</div>
                      <div className="text-sm text-muted-foreground">{age} days overdue</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outstanding by Franchise</CardTitle>
              <CardDescription>
                Franchises with outstanding balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.outstanding && reportData.outstanding.outstandingByFranchise.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Outstanding Balance</TableHead>
                      <TableHead>Overdue Payments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Blocked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.outstanding.outstandingByFranchise.map((franchise) => (
                      <TableRow key={franchise.id}>
                        <TableCell className="font-medium">{franchise.name}</TableCell>
                        <TableCell>{franchise.email}</TableCell>
                        <TableCell className={franchise.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(franchise.outstandingBalance)}
                        </TableCell>
                        <TableCell>{franchise.overduePayments}</TableCell>
                        <TableCell>{getStatusBadge(franchise.status)}</TableCell>
                        <TableCell>
                          {franchise.isBlocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            {franchise.outstandingBalance > 0 && (
                              <Button variant="destructive" size="sm">
                                Block
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No outstanding balances found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators for all franchises
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.performance && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{reportData.performance.overallMetrics.totalFranchises}</div>
                    <div className="text-sm text-muted-foreground">Total Franchises</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(reportData.performance.overallMetrics.totalRevenue)}</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(reportData.performance.overallMetrics.avgRevenuePerFranchise)}</div>
                    <div className="text-sm text-muted-foreground">Avg Revenue/Franchise</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{formatPercentage(reportData.performance.overallMetrics.avgCapacityUtilization)}</div>
                    <div className="text-sm text-muted-foreground">Avg Capacity Utilization</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Best performing franchises by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.performance && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Clients</TableHead>
                      <TableHead>Client Efficiency</TableHead>
                      <TableHead>Capacity Utilization</TableHead>
                      <TableHead>Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.performance.topPerformers.map((franchise) => (
                      <TableRow key={franchise.id}>
                        <TableCell className="font-medium">{franchise.name}</TableCell>
                        <TableCell>{formatCurrency(franchise.metrics.totalRevenue)}</TableCell>
                        <TableCell>{franchise.metrics.totalClients}</TableCell>
                        <TableCell>{formatCurrency(franchise.metrics.clientEfficiency)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${franchise.metrics.capacityUtilization}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{formatPercentage(franchise.metrics.capacityUtilization)}</span>
                          </div>
                        </TableCell>
                        <TableCell className={franchise.metrics.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(franchise.metrics.outstandingBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Needs Attention</CardTitle>
              <CardDescription>
                Franchises that require attention due to outstanding balances or other issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.performance && reportData.performance.needsAttention.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outstanding Balance</TableHead>
                      <TableHead>Blocked</TableHead>
                      <TableHead>Clients</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.performance.needsAttention.map((franchise) => (
                      <TableRow key={franchise.id}>
                        <TableCell className="font-medium">{franchise.name}</TableCell>
                        <TableCell>{getStatusBadge(franchise.status)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(franchise.metrics.outstandingBalance)}</TableCell>
                        <TableCell>
                          {franchise.isBlocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>{franchise.metrics.totalClients}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm">
                              Contact
                            </Button>
                            {!franchise.isBlocked && (
                              <Button variant="destructive" size="sm">
                                Block
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No franchises require attention at this time
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}