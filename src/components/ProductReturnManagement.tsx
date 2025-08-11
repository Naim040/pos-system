"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Package,
  DollarSign,
  User,
  Calendar,
  Store,
  FileText,
  Download,
  Info,
  AlertCircle,
  Check
} from 'lucide-react'

interface ReturnItem {
  id: string
  saleItemId: string
  productId: string
  variationId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  returnReason?: string
  condition: string
  restock: boolean
  notes?: string
  product: {
    id: string
    name: string
    sku?: string
    barcode?: string
    imageUrl?: string
  }
  variation?: {
    id: string
    sku?: string
  }
  saleItem: {
    id: string
    unitPrice: number
    quantity: number
  }
}

interface ReturnRefund {
  id: string
  amount: number
  method: string
  transactionId?: string
  processedBy: string
  processedAt: string
  notes?: string
  status: string
}

interface ProductReturn {
  id: string
  returnNumber: string
  saleId: string
  customerId?: string
  storeId: string
  userId: string
  status: string
  returnDate: string
  totalAmount: number
  taxAmount: number
  refundAmount: number
  refundType: string
  refundStatus: string
  restockItems: boolean
  notes?: string
  approvedBy?: string
  approvedAt?: string
  processedBy?: string
  processedAt?: string
  createdAt: string
  updatedAt: string
  sale: {
    id: string
    totalAmount: number
    customer?: {
      id: string
      name: string
      email: string
    }
    user: {
      id: string
      name: string
      email: string
    }
  }
  customer?: {
    id: string
    name: string
    email: string
  }
  store: {
    id: string
    name: string
    code: string
  }
  user: {
    id: string
    name: string
    email: string
  }
  returnItems: ReturnItem[]
  returnRefunds: ReturnRefund[]
  _count: {
    returnItems: number
  }
}

interface SaleForReturn {
  id: string
  totalAmount: number
  customer?: {
    id: string
    name: string
    email: string
    phone: string
  }
  store: {
    id: string
    name: string
    code: string
  }
  user: {
    id: string
    name: string
    email: string
  }
  saleItems: Array<{
    id: string
    productId: string
    variationId?: string
    quantity: number
    unitPrice: number
    totalPrice: number
    product: {
      id: string
      name: string
      sku?: string
      barcode?: string
      imageUrl?: string
    }
    variation?: {
      id: string
      sku?: string
    }
    returnedQuantity: number
    returnableQuantity: number
    returnableAmount: number
  }>
  payments: Array<{
    id: string
    amount: number
    method: string
    transactionId?: string
  }>
  totalReturns: number
  returnableAmount: number
  hasReturnableItems: boolean
  returnStatus: string
}

export default function ProductReturnManagement() {
  const [returns, setReturns] = useState<ProductReturn[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSaleSelectDialog, setShowSaleSelectDialog] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null)
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; returnId: string; action: 'approve' | 'reject' }>({ open: false, returnId: '', action: 'approve' })
  const [approvalComment, setApprovalComment] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterStore, setFilterStore] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedSale, setSelectedSale] = useState<SaleForReturn | null>(null)
  const [returnItems, setReturnItems] = useState<Array<{
    saleItemId: string
    quantity: number
    returnReason?: string
    condition: string
    restock: boolean
    notes?: string
  }>>([])
  const [refundType, setRefundType] = useState<string>('cash')
  const [restockItems, setRestockItems] = useState<boolean>(true)
  const [notes, setNotes] = useState<string>('')
  const [sales, setSales] = useState<SaleForReturn[]>([])
  const [loadingSales, setLoadingSales] = useState(false)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [stores, setStores] = useState<any[]>([])
  const [currentStore, setCurrentStore] = useState<any>(null)
  const [invoiceSearch, setInvoiceSearch] = useState<string>('')
  const [customerSearch, setCustomerSearch] = useState<string>('')
  const [searchMode, setSearchMode] = useState<'invoice' | 'browse'>('invoice')
  const { toast } = useToast()

  // User info (in real app, this would come from auth context)
  const currentUser = {
    id: 'current-user-id',
    name: 'Current User',
    email: 'user@example.com'
  }

  useEffect(() => {
    fetchStores()
    fetchReturns()
  }, [currentPage, filterStatus, filterStore, searchTerm, dateRange])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data)
        if (data.length > 0) {
          setCurrentStore(data[0]) // Use first store as default
        }
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
      // Fallback to default store
      setCurrentStore({
        id: 'cmdr94u7x000ayzdizq5z3coh',
        name: 'Main Store',
        code: 'MAIN'
      })
    }
  }

  const fetchReturns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterStore !== 'all') params.append('storeId', filterStore)
      if (searchTerm) params.append('search', searchTerm)
      if (dateRange.start) params.append('startDate', dateRange.start)
      if (dateRange.end) params.append('endDate', dateRange.end)

      const response = await fetch(`/api/returns?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReturns(data.returns)
        setTotalPages(data.pagination.pages)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch returns",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch returns",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesForReturn = async () => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store available",
        variant: "destructive"
      })
      return
    }

    setLoadingSales(true)
    try {
      let url = `/api/returns/sales?storeId=${currentStore.id}`
      
      // Add search parameters based on mode
      if (searchMode === 'invoice' && invoiceSearch.trim()) {
        url += `&search=${encodeURIComponent(invoiceSearch.trim())}`
      }
      
      if (customerSearch.trim()) {
        url += `&customer=${encodeURIComponent(customerSearch.trim())}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch sales",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sales",
        variant: "destructive"
      })
    } finally {
      setLoadingSales(false)
    }
  }

  const searchByInvoice = async () => {
    if (!invoiceSearch.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an invoice number",
        variant: "destructive"
      })
      return
    }
    await fetchSalesForReturn()
  }

  const resetSearch = () => {
    setInvoiceSearch('')
    setCustomerSearch('')
    setSelectedSale(null)
    setReturnItems([])
  }

  const switchSearchMode = (mode: 'invoice' | 'browse') => {
    setSearchMode(mode)
    resetSearch()
    if (mode === 'browse') {
      fetchSalesForReturn()
    }
  }

  const handleCreateReturn = async () => {
    if (!selectedSale || returnItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a sale and at least one item to return",
        variant: "destructive"
      })
      return
    }

    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store available",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: selectedSale.id,
          returnItems,
          refundType,
          restockItems,
          notes,
          storeId: currentStore.id,
          userId: currentUser.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReturns(prev => [data.return, ...prev])
        setShowCreateDialog(false)
        setShowSaleSelectDialog(false)
        setSelectedSale(null)
        setReturnItems([])
        setNotes('')
        toast({
          title: "Success",
          description: `Return ${data.return.returnNumber} created successfully`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create return",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create return",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReturnStatus = async (returnId: string, status: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          userId: currentUser.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReturns(prev => prev.map(ret => 
          ret.id === returnId ? data.return : ret
        ))
        toast({
          title: "Success",
          description: `Return status updated to ${status}`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update return",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update return",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReturn = async (returnId: string) => {
    if (!confirm('Are you sure you want to delete this return?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setReturns(prev => prev.filter(ret => ret.id !== returnId))
        toast({
          title: "Success",
          description: "Return deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete return",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete return",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalAction = (returnId: string, action: 'approve' | 'reject') => {
    setApprovalDialog({ open: true, returnId, action })
    setApprovalComment('')
  }

  const processApproval = async () => {
    if (!approvalDialog.returnId) return

    setApprovalLoading(true)
    try {
      const response = await fetch(`/api/returns/${approvalDialog.returnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: approvalDialog.action === 'approve' ? 'approved' : 'rejected',
          notes: approvalComment,
          userId: currentUser.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReturns(prev => prev.map(ret => 
          ret.id === approvalDialog.returnId ? data.return : ret
        ))
        
        toast({
          title: "Success",
          description: `Return ${approvalDialog.action === 'approve' ? 'approved' : 'rejected'} successfully`,
        })
        
        setApprovalDialog({ open: false, returnId: '', action: 'approve' })
        setApprovalComment('')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || `Failed to ${approvalDialog.action} return`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${approvalDialog.action} return`,
        variant: "destructive"
      })
    } finally {
      setApprovalLoading(false)
    }
  }

  const addReturnItem = (saleItem: any) => {
    const existingItem = returnItems.find(item => item.saleItemId === saleItem.id)
    
    if (existingItem) {
      // Update existing item
      setReturnItems(prev => prev.map(item => 
        item.saleItemId === saleItem.id 
          ? { ...item, quantity: Math.min(item.quantity + 1, saleItem.returnableQuantity) }
          : item
      ))
    } else {
      // Add new item
      setReturnItems(prev => [...prev, {
        saleItemId: saleItem.id,
        quantity: 1,
        returnReason: '',
        condition: 'good',
        restock: true,
        notes: ''
      }])
    }
  }

  const updateReturnItem = (saleItemId: string, field: string, value: any) => {
    setReturnItems(prev => prev.map(item => 
      item.saleItemId === saleItemId ? { ...item, [field]: value } : item
    ))
  }

  const removeReturnItem = (saleItemId: string) => {
    setReturnItems(prev => prev.filter(item => item.saleItemId !== saleItemId))
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      completed: 'outline'
    }

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      completed: CheckCircle
    }

    const Icon = icons[status as keyof typeof icons] || Clock

    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getRefundTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      adjustment: 'bg-purple-100 text-purple-800',
      credit: 'bg-orange-100 text-orange-800'
    }

    return (
      <Badge className={`capitalize ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </Badge>
    )
  }

  const filteredReturns = returns.filter(returnItem => {
    const matchesStatus = filterStatus === 'all' || returnItem.status === filterStatus
    const matchesSearch = searchTerm === '' || 
      returnItem.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  useEffect(() => {
    if (showSaleSelectDialog) {
      resetSearch()
      if (searchMode === 'browse') {
        fetchSalesForReturn()
      }
    }
  }, [showSaleSelectDialog])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Returns & Refunds</h1>
          <p className="text-gray-600">Manage product returns and refunds</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowSaleSelectDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Return
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{returns.length}</p>
                <p className="text-sm text-gray-600">Total Returns</p>
                <p className="text-xs text-gray-500">
                  {returns.length > 0 ? `↑ ${Math.round((returns.filter(r => r.status === 'completed').length / returns.length) * 100)}% completion rate` : 'No data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'pending').length}</p>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xs text-gray-500">
                  {returns.filter(r => r.status === 'pending').length > 0 ? 'Requires attention' : 'All processed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'completed').length}</p>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xs text-gray-500">
                  Successfully processed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  ${returns.reduce((sum, ret) => sum + ret.refundAmount, 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Total Refunded</p>
                <p className="text-xs text-gray-500">
                  Across all return types
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => setShowSaleSelectDialog(true)}
              className="h-20 flex-col space-y-2"
            >
              <Plus className="h-6 w-6" />
              <span>New Return</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setFilterStatus('pending')
                window.scrollTo({ top: 600, behavior: 'smooth' })
              }}
              className="h-20 flex-col space-y-2"
            >
              <Clock className="h-6 w-6" />
              <span>View Pending</span>
              <Badge variant="secondary" className="absolute top-2 right-2">
                {returns.filter(r => r.status === 'pending').length}
              </Badge>
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // This would navigate to reports in a real app
                toast({
                  title: "Reports",
                  description: "Return reports feature coming soon!",
                })
              }}
              className="h-20 flex-col space-y-2"
            >
              <FileText className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search and Quick Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by return #, customer, or items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchReturns} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Date Range:</span>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                    setDateRange({
                      start: last30Days.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                >
                  Last 30 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    setDateRange({
                      start: last7Days.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    setDateRange({
                      start: today.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                >
                  Today
                </Button>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(filterStatus !== 'all' || searchTerm || dateRange.start !== dateRange.end) && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filterStatus !== 'all' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Status: {filterStatus}</span>
                    <button 
                      onClick={() => setFilterStatus('all')}
                      className="ml-1 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Search: {searchTerm}</span>
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {dateRange.start !== dateRange.end && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Date: {dateRange.start} to {dateRange.end}</span>
                    <button 
                      onClick={() => {
                        const today = new Date()
                        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                        setDateRange({
                          start: last30Days.toISOString().split('T')[0],
                          end: today.toISOString().split('T')[0]
                        })
                      }}
                      className="ml-1 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Returns</CardTitle>
          <CardDescription>
            Manage and track product returns and refunds
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
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Refund Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((returnItem) => (
                  <TableRow key={returnItem.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {returnItem.returnNumber}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">
                          {new Date(returnItem.returnDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">
                          {returnItem.customer?.name || returnItem.sale.customer?.name || 'Walk-in Customer'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Package className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">
                          {returnItem._count.returnItems} items
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium">
                          ${returnItem.refundAmount.toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                    <TableCell>{getRefundTypeBadge(returnItem.refundType)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReturn(returnItem)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {returnItem.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApprovalAction(returnItem.id, 'approve')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApprovalAction(returnItem.id, 'reject')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {returnItem.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateReturnStatus(returnItem.id, 'completed')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        {returnItem.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteReturn(returnItem.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sale Selection Dialog */}
      <Dialog open={showSaleSelectDialog} onOpenChange={setShowSaleSelectDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Select Sale for Return</DialogTitle>
            <DialogDescription>
              Search for a specific invoice or browse recent sales to process returns
            </DialogDescription>
          </DialogHeader>
          
          {/* Search Mode Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={searchMode === 'invoice' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => switchSearchMode('invoice')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Search by Invoice
            </Button>
            <Button
              variant={searchMode === 'browse' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => switchSearchMode('browse')}
              className="flex-1"
            >
              <Package className="h-4 w-4 mr-2" />
              Browse All Sales
            </Button>
          </div>

          {/* Search Interface */}
          <div className="space-y-4">
            {searchMode === 'invoice' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-search" className="text-sm font-medium">
                      Invoice Number / Transaction ID *
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="invoice-search"
                        placeholder="Enter invoice number (e.g., cmdsjijqm0001tpt1n81iabcu)"
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchByInvoice()}
                        className="flex-1"
                      />
                      <Button onClick={searchByInvoice} disabled={loadingSales}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter the complete or partial invoice ID to search
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer-search" className="text-sm font-medium">
                      Customer Name/Phone (Optional)
                    </Label>
                    <Input
                      id="customer-search"
                      placeholder="Filter by customer name or phone"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchByInvoice()}
                    />
                    <p className="text-xs text-gray-500">
                      Narrow down results by customer information
                    </p>
                  </div>
                </div>

                {/* Search Results */}
                {invoiceSearch && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Search Results</h3>
                      <Button variant="ghost" size="sm" onClick={resetSearch}>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    {loadingSales ? (
                      <div className="text-center py-4">Searching...</div>
                    ) : sales.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No sales found matching your search criteria
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sales.map((sale) => (
                          <Card 
                            key={sale.id} 
                            className={`cursor-pointer transition-colors ${
                              selectedSale?.id === sale.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedSale(sale)}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-sm">
                                      Invoice: {sale.id.slice(-12)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {sale.returnStatus.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div className="flex items-center space-x-1">
                                      <User className="h-3 w-3" />
                                      <span>{sale.customer?.name || 'Walk-in Customer'}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <DollarSign className="h-3 w-3" />
                                      <span>Total: ${sale.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Package className="h-3 w-3" />
                                      <span>Returnable: ${sale.returnableAmount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                  
                                  {sale.hasReturnableItems && (
                                    <div className="mt-2">
                                      <div className="text-xs font-medium text-gray-700 mb-1">
                                        Returnable Items:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {sale.returnableItems.slice(0, 3).map((item) => (
                                          <Badge key={item.id} variant="secondary" className="text-xs">
                                            {item.product.name} ({item.returnableQuantity})
                                          </Badge>
                                        ))}
                                        {sale.returnableItems.length > 3 && (
                                          <Badge variant="secondary" className="text-xs">
                                            +{sale.returnableItems.length - 3} more
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="ml-4">
                                  {selectedSale?.id === sale.id ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <div className="h-5 w-5 border-2 border-gray-300 rounded" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Browse Mode - Show all recent sales */
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search by customer name, email, or invoice ID..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchSalesForReturn()}
                  />
                  <Button onClick={fetchSalesForReturn} disabled={loadingSales}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {loadingSales ? (
                      <div className="text-center py-8">Loading sales...</div>
                    ) : sales.length === 0 ? (
                      <div className="text-center py-8">No sales available for return</div>
                    ) : (
                      sales.map((sale) => (
                        <Card 
                          key={sale.id} 
                          className={`cursor-pointer transition-colors ${
                            selectedSale?.id === sale.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedSale(sale)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Sale #{sale.id}</span>
                                  <Badge variant="outline">
                                    {sale.returnStatus.replace('_', ' ')}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span>{sale.customer?.name || 'Walk-in Customer'}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>Total: ${sale.totalAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Package className="h-3 w-3" />
                                    <span>Returnable: ${sale.returnableAmount.toFixed(2)}</span>
                                  </div>
                                </div>
                                
                                {sale.hasReturnableItems && (
                                  <div className="mt-2">
                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                      Returnable Items:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {sale.returnableItems.slice(0, 3).map((item) => (
                                        <Badge key={item.id} variant="secondary" className="text-xs">
                                          {item.product.name} ({item.returnableQuantity})
                                        </Badge>
                                      ))}
                                      {sale.returnableItems.length > 3 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{sale.returnableItems.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="ml-4">
                                {selectedSale?.id === sale.id ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <div className="h-5 w-5 border-2 border-gray-300 rounded" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSaleSelectDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowSaleSelectDialog(false)
                  setShowCreateDialog(true)
                }}
                disabled={!selectedSale}
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Return Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Create New Return</DialogTitle>
            <DialogDescription>
              Process return for sale #{selectedSale?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Sale Information */}
            {selectedSale && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sale Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Customer</Label>
                      <p>{selectedSale.customer?.name || 'Walk-in Customer'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Sale Date</Label>
                      <p>{new Date(selectedSale.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Total Amount</Label>
                      <p>${selectedSale.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Returnable Amount</Label>
                      <p>${selectedSale.returnableAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Return Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Return Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedSale?.returnableItems.map((saleItem) => {
                    const returnItem = returnItems.find(item => item.saleItemId === saleItem.id)
                    
                    return (
                      <div key={saleItem.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <h4 className="font-medium">{saleItem.product.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {saleItem.product.sku && `SKU: ${saleItem.product.sku}`}
                                  {saleItem.variation?.sku && ` | Var: ${saleItem.variation.sku}`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="font-medium">Original Quantity</Label>
                                <p>{saleItem.quantity} @ ${saleItem.unitPrice.toFixed(2)}</p>
                              </div>
                              <div>
                                <Label className="font-medium">Already Returned</Label>
                                <p>{saleItem.returnedQuantity}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {returnItem ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeReturnItem(saleItem.id)}
                              >
                                Remove
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => addReturnItem(saleItem)}
                              >
                                Add to Return
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {returnItem && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Return Quantity</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={saleItem.returnableQuantity}
                                  value={returnItem.quantity}
                                  onChange={(e) => updateReturnItem(saleItem.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Condition</Label>
                                <Select 
                                  value={returnItem.condition} 
                                  onValueChange={(value) => updateReturnItem(saleItem.id, 'condition', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="good">Good</SelectItem>
                                    <SelectItem value="damaged">Damaged</SelectItem>
                                    <SelectItem value="defective">Defective</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Return Reason</Label>
                                <Select 
                                  value={returnItem.returnReason || ''} 
                                  onValueChange={(value) => updateReturnItem(saleItem.id, 'returnReason', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select reason" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="damaged">Damaged</SelectItem>
                                    <SelectItem value="wrong_item">Wrong Item</SelectItem>
                                    <SelectItem value="defective">Defective</SelectItem>
                                    <SelectItem value="changed_mind">Changed Mind</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`restock-${saleItem.id}`}
                                  checked={returnItem.restock}
                                  onCheckedChange={(checked) => updateReturnItem(saleItem.id, 'restock', checked)}
                                />
                                <Label htmlFor={`restock-${saleItem.id}`} className="text-sm">
                                  Restock to inventory
                                </Label>
                              </div>
                              
                              <div className="flex-1">
                                <Label className="text-sm font-medium">Notes</Label>
                                <Input
                                  placeholder="Optional notes..."
                                  value={returnItem.notes || ''}
                                  onChange={(e) => updateReturnItem(saleItem.id, 'notes', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Return Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Return Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Refund Type</Label>
                    <Select value={refundType} onValueChange={setRefundType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash Refund</SelectItem>
                        <SelectItem value="card">Card Refund</SelectItem>
                        <SelectItem value="adjustment">Customer Adjustment</SelectItem>
                        <SelectItem value="credit">Store Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="restock-items"
                      checked={restockItems}
                      onCheckedChange={setRestockItems}
                    />
                    <Label htmlFor="restock-items" className="font-medium">
                      Restock all items to inventory
                    </Label>
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Notes</Label>
                  <Textarea
                    placeholder="Additional notes about this return..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Return Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span>{returnItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${returnItems.reduce((sum, item) => {
                        const saleItem = selectedSale?.returnableItems.find(si => si.id === item.saleItemId)
                        return sum + (item.quantity * (saleItem?.unitPrice || 0))
                      }, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%):</span>
                      <span>${(returnItems.reduce((sum, item) => {
                        const saleItem = selectedSale?.returnableItems.find(si => si.id === item.saleItemId)
                        return sum + (item.quantity * (saleItem?.unitPrice || 0))
                      }, 0) * 0.1).toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total Refund:</span>
                      <span>${(returnItems.reduce((sum, item) => {
                        const saleItem = selectedSale?.returnableItems.find(si => si.id === item.saleItemId)
                        return sum + (item.quantity * (saleItem?.unitPrice || 0))
                      }, 0) * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateReturn}
                disabled={loading || returnItems.length === 0}
              >
                {loading ? 'Creating...' : 'Create Return'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Details Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Return Details - {selectedReturn?.returnNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-6">
              {/* Return Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Return Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Return Number</Label>
                      <p>{selectedReturn.returnNumber}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Status</Label>
                      <p>{getStatusBadge(selectedReturn.status)}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Return Date</Label>
                      <p>{new Date(selectedReturn.returnDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Refund Type</Label>
                      <p>{getRefundTypeBadge(selectedReturn.refundType)}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Total Amount</Label>
                      <p>${selectedReturn.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Refund Amount</Label>
                      <p>${selectedReturn.refundAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Restock Items</Label>
                      <p>{selectedReturn.restockItems ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Customer</Label>
                      <p>{selectedReturn.customer?.name || selectedReturn.sale.customer?.name || 'Walk-in Customer'}</p>
                    </div>
                  </div>
                  
                  {/* Approval History */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    {selectedReturn.approvedBy && (
                      <div>
                        <Label className="font-medium">Approved By</Label>
                        <p>{selectedReturn.approvedBy}</p>
                        {selectedReturn.approvedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(selectedReturn.approvedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedReturn.processedBy && (
                      <div>
                        <Label className="font-medium">Processed By</Label>
                        <p>{selectedReturn.processedBy}</p>
                        {selectedReturn.processedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(selectedReturn.processedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedReturn.notes && (
                    <div className="mt-4">
                      <Label className="font-medium">Notes</Label>
                      <p className="mt-1 text-sm">{selectedReturn.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Return Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Returned Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedReturn.returnItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.product.name}</h4>
                            <p className="text-sm text-gray-500">
                              {item.product.sku && `SKU: ${item.product.sku}`}
                              {item.variation?.sku && ` | Var: ${item.variation.sku}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">{item.quantity} @ ${item.unitPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline">{item.condition}</Badge>
                          {item.returnReason && (
                            <Badge variant="secondary">{item.returnReason.replace('_', ' ')}</Badge>
                          )}
                          <Badge variant={item.restock ? "default" : "destructive"}>
                            {item.restock ? "Restocked" : "Not Restocked"}
                          </Badge>
                        </div>
                        
                        {item.notes && (
                          <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedReturn(null)}>
                  Close
                </Button>
                {selectedReturn.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        handleApprovalAction(selectedReturn.id, 'approve')
                        setSelectedReturn(null)
                      }}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        handleApprovalAction(selectedReturn.id, 'reject')
                        setSelectedReturn(null)
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedReturn.status === 'approved' && (
                  <Button 
                    onClick={() => {
                      handleUpdateReturnStatus(selectedReturn.id, 'completed')
                      setSelectedReturn(null)
                    }}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => !open && setApprovalDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {approvalDialog.action === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>
                {approvalDialog.action === 'approve' ? 'Approve Return' : 'Reject Return'}
              </span>
            </DialogTitle>
            <DialogDescription>
              {approvalDialog.action === 'approve' 
                ? 'Are you sure you want to approve this return? This will process the refund and restock items if enabled.' 
                : 'Are you sure you want to reject this return? This will cancel the return process.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-comment" className="text-sm font-medium">
                Approval Comment (Optional)
              </Label>
              <Textarea
                id="approval-comment"
                placeholder="Add a comment about this approval decision..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">What happens next:</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                {approvalDialog.action === 'approve' ? (
                  <>
                    <li>• Return status will be changed to "Approved"</li>
                    <li>• Items will be restocked to inventory (if enabled)</li>
                    <li>• Customer balance will be adjusted (if applicable)</li>
                    <li>• Return can then be marked as "Completed"</li>
                  </>
                ) : (
                  <>
                    <li>• Return status will be changed to "Rejected"</li>
                    <li>• No refunds will be processed</li>
                    <li>• Items will not be restocked</li>
                    <li>• Return can be deleted if needed</li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setApprovalDialog(prev => ({ ...prev, open: false }))}
                disabled={approvalLoading}
              >
                Cancel
              </Button>
              <Button 
                variant={approvalDialog.action === 'approve' ? 'default' : 'destructive'}
                onClick={processApproval}
                disabled={approvalLoading}
              >
                {approvalLoading ? 'Processing...' : approvalDialog.action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}