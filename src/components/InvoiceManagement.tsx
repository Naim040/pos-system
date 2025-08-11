"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Mail, 
  Printer, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'
import InvoiceComponent from './InvoiceComponent'

interface InvoiceItem {
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product: {
    name: string
    price: number
    sku?: string
  }
}

interface Invoice {
  id: string
  totalAmount: number
  taxAmount: number
  discount: number
  paymentMethod: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  createdAt: string
  dueDate?: string
  user: {
    name: string
  }
  saleItems: InvoiceItem[]
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
}

export default function InvoiceManagement() {
  const { toast } = useToast()
  const { user, hasRole } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Load invoices from API
  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchTerm, statusFilter, dateFilter])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      } else {
        // Fallback to mock data
        const mockInvoices: Invoice[] = [
          {
            id: 'inv-001',
            totalAmount: 1000,
            taxAmount: 80,
            discount: 0,
            paymentMethod: 'bank_transfer',
            customerName: 'ABC Company Ltd',
            customerEmail: 'accounts@abccompany.com',
            customerPhone: '+880 1234-567890',
            customerAddress: '123 Business District, Dhaka',
            createdAt: '2024-01-15T10:30:00Z',
            dueDate: '2024-02-14T10:30:00Z',
            user: { name: 'John Doe' },
            saleItems: [
              {
                productId: '1',
                quantity: 10,
                unitPrice: 100,
                totalPrice: 1000,
                product: { name: 'Office Chair', price: 100, sku: 'CHR-001' }
              }
            ],
            status: 'sent'
          },
          {
            id: 'inv-002',
            totalAmount: 2500,
            taxAmount: 200,
            discount: 100,
            paymentMethod: 'cash',
            customerName: 'XYZ Corporation',
            customerEmail: 'finance@xyzcorp.com',
            createdAt: '2024-01-10T14:20:00Z',
            dueDate: '2024-02-09T14:20:00Z',
            user: { name: 'Jane Smith' },
            saleItems: [
              {
                productId: '2',
                quantity: 5,
                unitPrice: 500,
                totalPrice: 2500,
                product: { name: 'Desk Lamp', price: 500, sku: 'LMP-001' }
              }
            ],
            status: 'paid'
          },
          {
            id: 'inv-003',
            totalAmount: 750,
            taxAmount: 60,
            discount: 0,
            paymentMethod: 'card',
            customerName: 'Small Business Inc',
            customerEmail: 'contact@smallbusiness.com',
            createdAt: '2024-01-05T09:15:00Z',
            dueDate: '2024-01-20T09:15:00Z',
            user: { name: 'Mike Johnson' },
            saleItems: [
              {
                productId: '3',
                quantity: 3,
                unitPrice: 250,
                totalPrice: 750,
                product: { name: 'Monitor Stand', price: 250, sku: 'STN-001' }
              }
            ],
            status: 'overdue'
          }
        ]
        setInvoices(mockInvoices)
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterInvoices = () => {
    let filtered = invoices

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Date filter
    const now = new Date()
    if (dateFilter === 'today') {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt)
        return invoiceDate.toDateString() === now.toDateString()
      })
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt)
        return invoiceDate >= weekAgo
      })
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt)
        return invoiceDate >= monthAgo
      })
    }

    setFilteredInvoices(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />
      case 'sent':
        return <Mail className="h-4 w-4" />
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setInvoices(prev =>
          prev.map(invoice =>
            invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
          )
        )
        toast({
          title: "Status updated",
          description: `Invoice status changed to ${newStatus}`,
        })
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive"
      })
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
        toast({
          title: "Invoice deleted",
          description: "Invoice has been deleted successfully",
        })
      } else {
        throw new Error('Failed to delete invoice')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      })
    }
  }

  const totalRevenue = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount + inv.taxAmount - inv.discount, 0)

  const pendingAmount = filteredInvoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.totalAmount + inv.taxAmount - inv.discount, 0)

  const overdueCount = filteredInvoices.filter(inv => inv.status === 'overdue').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Management</h2>
          <p className="text-gray-600">Create, manage, and track customer invoices</p>
        </div>
        <Button className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">{formatPrice(pendingAmount)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Invoices</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const total = invoice.totalAmount + invoice.taxAmount - invoice.discount
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id.slice(-8)}</TableCell>
                      <TableCell>{invoice.customerName || 'N/A'}</TableCell>
                      <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {invoice.dueDate 
                          ? new Date(invoice.dueDate).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(total)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status || 'draft')}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(invoice.status || 'draft')}
                            <span className="capitalize">{invoice.status || 'draft'}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setShowInvoice(true)
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setShowInvoice(true)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      {showInvoice && selectedInvoice && (
        <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>
            <InvoiceComponent
              invoice={selectedInvoice}
              onClose={() => setShowInvoice(false)}
              onStatusChange={(newStatus) => {
                handleStatusChange(selectedInvoice.id, newStatus)
                setShowInvoice(false)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}