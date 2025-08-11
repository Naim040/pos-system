"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Calendar, DollarSign, ShoppingCart, TrendingUp, Download, Search, Package, Receipt } from 'lucide-react'
import { formatPrice } from '@/lib/currency'
import ReceiptComponent from './ReceiptComponent'

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
    }
  }[]
  payments: {
    id: string
    amount: number
    method: string
    transactionId?: string
    createdAt: string
  }[]
}

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSales()
  }, [])

  useEffect(() => {
    filterSales()
  }, [sales, searchTerm, dateFilter, paymentMethodFilter, statusFilter])

  const fetchSales = async () => {
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

    return {
      totalSales,
      totalTax,
      totalRevenue,
      averageSale,
      totalItems,
      saleCount: filteredSales.length
    }
  }

  const stats = calculateStats()

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

  const handleShowReceipt = (sale: Sale) => {
    setSelectedSale(sale)
    setShowReceipt(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <Badge variant="outline">Cash</Badge>
      case 'card':
        return <Badge variant="outline">Card</Badge>
      case 'mobile':
        return <Badge variant="outline">Mobile</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sales History & Reports</h2>
          <p className="text-gray-600">View and analyze your sales data</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
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
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
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

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions ({filteredSales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sales found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSales.map((sale) => (
                  <Card key={sale.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">Sale #{sale.id.slice(-8)}</h3>
                            {getStatusBadge(sale.status)}
                            {getPaymentMethodBadge(sale.paymentMethod)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(sale.createdAt).toLocaleDateString()} at {new Date(sale.createdAt).toLocaleTimeString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Staff: {sale.user.name}
                          </p>
                          {sale.customerName && (
                            <p className="text-sm text-gray-600">
                              Customer: {sale.customerName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatPrice(sale.totalAmount + sale.taxAmount)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {sale.saleItems.length} items
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Items:</h4>
                        {sale.saleItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.product.name}</span>
                            <span>{formatPrice(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex justify-between text-sm">
                        <div>
                          <span>Subtotal: {formatPrice(sale.totalAmount)}</span>
                          <span className="ml-4">Tax: {formatPrice(sale.taxAmount)}</span>
                        </div>
                        <span className="font-medium">Total: {formatPrice(sale.totalAmount + sale.taxAmount)}</span>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShowReceipt(sale)}
                        >
                          <Receipt className="h-3 w-3 mr-1" />
                          View Receipt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      {showReceipt && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Transaction Receipt</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReceipt(false)
                    setSelectedSale(null)
                  }}
                >
                  Close
                </Button>
              </div>
              <ReceiptComponent 
                sale={selectedSale} 
                onClose={() => {
                  setShowReceipt(false)
                  setSelectedSale(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}