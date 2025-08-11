"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Users, 
  Store,
  FileText,
  BarChart3,
  PieChart
} from 'lucide-react'

interface ReportData {
  summary: {
    totalReturns: number
    totalRefundAmount: number
    averageRefundAmount: number
  }
  refundsByType: Array<{
    refundType: string
    _sum: { refundAmount: number }
    _count: number
  }>
  returnsByReason: Array<{
    returnReason: string
    _sum: { quantity: number }
    _count: number
  }>
  returnsByStatus: Array<{
    status: string
    _sum: { refundAmount: number }
    _count: number
  }>
  returnsByDay: Array<{
    returnDate: string
    _count: number
    _sum: { refundAmount: number }
  }>
  topReturnedProducts: Array<{
    productId: string
    _sum: { quantity: number }
    _count: number
    product: {
      id: string
      name: string
      sku?: string
      barcode?: string
    }
  }>
  returns: Array<any>
}

export default function ReturnReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<string>('summary')
  const [storeId, setStoreId] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const { toast } = useToast()

  useEffect(() => {
    fetchReport()
  }, [reportType, storeId, startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate,
        endDate
      })

      if (storeId !== 'all') {
        params.append('storeId', storeId)
      }

      const response = await fetch(`/api/returns/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch report data",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    if (!reportData) return

    let csvContent = ''

    if (reportType === 'summary') {
      csvContent = [
        ['Report Type', 'Summary Report'],
        ['Date Range', `${startDate} to ${endDate}`],
        ['Total Returns', reportData.summary.totalReturns.toString()],
        ['Total Refund Amount', reportData.summary.totalRefundAmount.toFixed(2)],
        ['Average Refund Amount', reportData.summary.averageRefundAmount.toFixed(2)],
        [''],
        ['Refund Type', 'Count', 'Amount'],
        ...reportData.refundsByType.map(item => [
          item.refundType,
          item._count.toString(),
          item._sum.refundAmount.toFixed(2)
        ]),
        [''],
        ['Return Status', 'Count', 'Amount'],
        ...reportData.returnsByStatus.map(item => [
          item.status,
          item._count.toString(),
          item._sum.refundAmount.toFixed(2)
        ])
      ].map(row => row.join(',')).join('\n')
    } else if (reportType === 'detailed') {
      csvContent = [
        ['Return Number', 'Date', 'Customer', 'Status', 'Refund Type', 'Amount', 'Items'],
        ...reportData.returns.map(ret => [
          ret.returnNumber,
          new Date(ret.returnDate).toLocaleDateString(),
          ret.customer?.name || ret.sale.customer?.name || 'Walk-in Customer',
          ret.status,
          ret.refundType,
          ret.refundAmount.toFixed(2),
          ret._count.returnItems.toString()
        ])
      ].map(row => row.join(',')).join('\n')
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `return-report-${reportType}-${startDate}-to-${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getRefundTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      adjustment: 'bg-purple-100 text-purple-800',
      credit: 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading report data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Return Reports</h1>
          <p className="text-gray-600">Analyze return and refund data</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="analytics">Analytics Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="store">Store</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  <SelectItem value="current-store-id">Main Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {reportType === 'summary' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{reportData.summary.totalReturns}</p>
                    <p className="text-sm text-gray-600">Total Returns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData.summary.totalRefundAmount)}
                    </p>
                    <p className="text-sm text-gray-600">Total Refunded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData.summary.averageRefundAmount)}
                    </p>
                    <p className="text-sm text-gray-600">Average Refund</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {reportData.returnsByStatus.find(s => s.status === 'completed')?._count || 0}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Refunds by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Refunds by Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.refundsByType.map((item, index) => {
                    const percentage = reportData.summary.totalRefundAmount > 0 
                      ? (item._sum.refundAmount / reportData.summary.totalRefundAmount) * 100 
                      : 0
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Badge className={getRefundTypeColor(item.refundType)}>
                              {item.refundType}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {item._count} returns
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {formatCurrency(item._sum.refundAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Returns by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Returns by Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.returnsByStatus.map((item, index) => {
                    const percentage = reportData.summary.totalReturns > 0 
                      ? (item._count / reportData.summary.totalReturns) * 100 
                      : 0
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              item.status === 'completed' ? 'default' :
                              item.status === 'pending' ? 'secondary' :
                              item.status === 'approved' ? 'outline' : 'destructive'
                            }>
                              {item.status}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {item._count} returns
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {formatCurrency(item._sum.refundAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Returned Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Returned Products</CardTitle>
              <CardDescription>Products with the highest return quantities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity Returned</TableHead>
                      <TableHead>Return Count</TableHead>
                      <TableHead>Avg per Return</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topReturnedProducts.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.product.name}
                        </TableCell>
                        <TableCell>{item.product.sku || 'N/A'}</TableCell>
                        <TableCell>{item._sum.quantity}</TableCell>
                        <TableCell>{item._count}</TableCell>
                        <TableCell>
                          {(item._sum.quantity / item._count).toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Returns by Reason */}
          <Card>
            <CardHeader>
              <CardTitle>Return Reasons</CardTitle>
              <CardDescription>Common reasons for product returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.returnsByReason.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium capitalize">
                        {item.returnReason?.replace('_', ' ') || 'No Reason'}
                      </h4>
                      <Badge variant="secondary">
                        {item._count} returns
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {item._sum.quantity} items returned
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {reportType === 'detailed' && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Return Report</CardTitle>
            <CardDescription>
              Complete list of returns with detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Refund Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.returns.map((returnItem, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {returnItem.returnNumber}
                      </TableCell>
                      <TableCell>
                        {new Date(returnItem.returnDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {returnItem.customer?.name || 
                         returnItem.sale.customer?.name || 
                         'Walk-in Customer'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          returnItem.status === 'completed' ? 'default' :
                          returnItem.status === 'pending' ? 'secondary' :
                          returnItem.status === 'approved' ? 'outline' : 'destructive'
                        }>
                          {returnItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRefundTypeColor(returnItem.refundType)}>
                          {returnItem.refundType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(returnItem.refundAmount)}
                      </TableCell>
                      <TableCell>{returnItem._count.returnItems}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {reportType === 'analytics' && (
        <div className="text-center py-8">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analytics Report
          </h3>
          <p className="text-gray-600">
            Advanced analytics features coming soon! This will include trends, forecasts, and detailed insights.
          </p>
        </div>
      )}
    </div>
  )
}