"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Download, 
  Printer, 
  Mail, 
  Settings, 
  Barcode, 
  Gift, 
  Shield, 
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  Eye,
  Save,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Package,
  Receipt,
  X
} from 'lucide-react'
import InvoiceTemplate from './InvoiceTemplate'
import ThermalPrinter80mm from './ThermalPrinter80mm'
import { PDFGenerator, type InvoiceData } from '@/lib/pdfGenerator'
import { EmailService } from '@/lib/emailService'
import { generateBarcode } from '@/lib/barcode'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'

interface InvoiceTemplateSettings {
  id: string
  name: string
  type: 'a4' | 'thermal'
  header: {
    showLogo: boolean
    showBusinessInfo: boolean
    showInvoiceNumber: boolean
    showDate: boolean
    customText?: string
  }
  sections: {
    showCustomerInfo: boolean
    showPaymentInfo: boolean
    showTaxBreakdown: boolean
    showDiscountBreakdown: boolean
    showLoyaltyInfo: boolean
    showWarrantyInfo: boolean
    showBarcode: boolean
    showTerms: boolean
  }
  footer: {
    showThankYou: boolean
    showContactInfo: boolean
    showReturnPolicy: boolean
    customText?: string
  }
  styling: {
    theme: 'modern' | 'classic' | 'minimal'
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    fontSize: number
  }
}

interface InvoiceManagementSystemProps {
  initialInvoices?: InvoiceData[]
  businessInfo?: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    taxId: string
  }
}

export default function InvoiceManagementSystem({
  initialInvoices = [],
  businessInfo = {
    name: 'Your Business Name',
    address: '123 Business Street, City, State 12345',
    phone: '(555) 123-4567',
    email: 'info@business.com',
    website: 'www.business.com',
    taxId: 'TAX123456789'
  }
}: InvoiceManagementSystemProps) {
  const [invoices, setInvoices] = useState<InvoiceData[]>(initialInvoices)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [templateSettings, setTemplateSettings] = useState<InvoiceTemplateSettings>({
    id: 'default',
    name: 'Modern Invoice',
    type: 'a4',
    header: {
      showLogo: true,
      showBusinessInfo: true,
      showInvoiceNumber: true,
      showDate: true,
      customText: ''
    },
    sections: {
      showCustomerInfo: true,
      showPaymentInfo: true,
      showTaxBreakdown: true,
      showDiscountBreakdown: true,
      showLoyaltyInfo: true,
      showWarrantyInfo: true,
      showBarcode: true,
      showTerms: true
    },
    footer: {
      showThankYou: true,
      showContactInfo: true,
      showReturnPolicy: true,
      customText: ''
    },
    styling: {
      theme: 'modern',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'Inter, sans-serif',
      fontSize: 12
    }
  })

  const [emailDialog, setEmailDialog] = useState<{
    isOpen: boolean
    invoice: InvoiceData | null
    emailType: 'invoice' | 'receipt' | 'reminder' | 'thank-you'
  }>({ isOpen: false, invoice: null, emailType: 'invoice' })

  const [emailAddress, setEmailAddress] = useState('')
  const [showThermalPrinter, setShowThermalPrinter] = useState(false)

  const invoiceRef = useRef<HTMLDivElement>(null)

  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

    const matchesDate = dateFilter === 'all' || (() => {
      const invoiceDate = new Date(invoice.date)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))

      switch (dateFilter) {
        case 'today': return daysDiff === 0
        case 'week': return daysDiff <= 7
        case 'month': return daysDiff <= 30
        case 'quarter': return daysDiff <= 90
        default: return true
      }
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  const handleCreateInvoice = () => {
    const newInvoice: InvoiceData = {
      id: Date.now().toString(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      status: 'draft',
      customer: {
        id: '1',
        name: 'New Customer',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        taxId: ''
      },
      items: [],
      payments: [],
      taxes: [],
      discounts: [],
      warranties: [],
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      totalAmount: 0,
      paidAmount: 0,
      balanceDue: 0,
      barcode: generateBarcode(Date.now().toString().slice(-6), { format: 'CODE128' })
    }

    setSelectedInvoice(newInvoice)
    setIsCreating(true)
    setIsEditing(true)
  }

  const handleSaveInvoice = (invoice: InvoiceData) => {
    if (isCreating) {
      setInvoices(prev => [...prev, invoice])
      setIsCreating(false)
    } else {
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? invoice : inv))
    }
    setIsEditing(false)
    setSelectedInvoice(null)
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null)
      }
    }
  }

  const handlePrint = async () => {
    if (!selectedInvoice) return

    try {
      const pdfBlob = await PDFGenerator.generateInvoicePDF(selectedInvoice, {
        autoPrint: true,
        filename: `invoice-${selectedInvoice.invoiceNumber}.pdf`
      })
      await PDFGenerator.printPDF(pdfBlob)
    } catch (error) {
      console.error('Print error:', error)
      alert('Failed to generate PDF for printing')
    }
  }

  const handleThermalPrint = () => {
    if (!selectedInvoice) return
    setShowThermalPrinter(true)
  }

  const handleDownload = async (format: 'pdf' | 'html') => {
    if (!selectedInvoice) return

    try {
      if (format === 'pdf') {
        const pdfBlob = await PDFGenerator.generateInvoicePDF(selectedInvoice, {
          filename: `invoice-${selectedInvoice.invoiceNumber}.pdf`
        })
        PDFGenerator.downloadPDF(pdfBlob, `invoice-${selectedInvoice.invoiceNumber}.pdf`)
      } else {
        if (invoiceRef.current) {
          const htmlContent = invoiceRef.current.innerHTML
          const blob = new Blob([htmlContent], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `invoice-${selectedInvoice.invoiceNumber}.html`
          a.click()
          URL.revokeObjectURL(url)
        }
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download invoice')
    }
  }

  const handleEmail = (type: 'invoice' | 'receipt' | 'reminder' | 'thank-you') => {
    if (!selectedInvoice) return

    setEmailDialog({
      isOpen: true,
      invoice: selectedInvoice,
      emailType: type
    })
    setEmailAddress(selectedInvoice.customer.email || '')
  }

  const handleSendEmail = async () => {
    if (!emailDialog.invoice || !emailAddress) return

    try {
      const pdfBlob = await PDFGenerator.generateInvoicePDF(emailDialog.invoice, {
        filename: `invoice-${emailDialog.invoice.invoiceNumber}.pdf`
      })

      const emailData = {
        customerName: emailDialog.invoice.customer.name,
        invoiceNumber: emailDialog.invoice.invoiceNumber,
        invoiceDate: emailDialog.invoice.date,
        dueDate: emailDialog.invoice.dueDate,
        totalAmount: emailDialog.invoice.totalAmount,
        currency: 'USD',
        businessName: businessInfo.name,
        businessContact: `${businessInfo.phone} | ${businessInfo.email}`,
        paymentLink: `https://yourbusiness.com/pay/${emailDialog.invoice.invoiceNumber}`,
        viewOnlineLink: `https://yourbusiness.com/invoice/${emailDialog.invoice.invoiceNumber}`,
        items: emailDialog.invoice.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      }

      let success = false
      switch (emailDialog.emailType) {
        case 'invoice':
          success = await EmailService.sendInvoice(emailAddress, emailData, pdfBlob)
          break
        case 'receipt':
          success = await EmailService.sendReceipt(emailAddress, emailData, pdfBlob)
          break
        case 'reminder':
          success = await EmailService.sendPaymentReminder(emailAddress, emailData, 30)
          break
        case 'thank-you':
          success = await EmailService.sendThankYou(emailAddress, emailData)
          break
      }

      if (success) {
        alert('Email sent successfully!')
        setEmailDialog({ isOpen: false, invoice: null, emailType: 'invoice' })
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      console.error('Email error:', error)
      alert('Failed to send email')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'draft': 'secondary',
      'sent': 'default',
      'paid': 'outline',
      'overdue': 'destructive',
      'cancelled': 'secondary'
    }

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getInvoiceStats = () => {
    const totalInvoices = invoices.length
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
    const outstandingAmount = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0)

    return {
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue,
      outstandingAmount
    }
  }

  const stats = getInvoiceStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and send invoices with customizable templates
          </p>
        </div>
        <Button onClick={handleCreateInvoice}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.totalInvoices}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">{stats.paidInvoices}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(stats.outstandingAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1">
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

                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No invoices found</p>
                  </div>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedInvoice?.id === invoice.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-gray-600">{invoice.customer.name}</p>
                        </div>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>{new Date(invoice.date).toLocaleDateString()}</span>
                        <span className="font-medium">{formatPrice(invoice.totalAmount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Preview/Editor */}
        <div className="lg:col-span-2">
          {selectedInvoice ? (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={handleThermalPrint}>
                    <Receipt className="w-4 h-4 mr-2" />
                    Thermal 80mm
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('html')}>
                    <FileText className="w-4 h-4 mr-2" />
                    HTML
                  </Button>
                  <Button variant="outline" onClick={() => handleEmail('invoice')}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                  {isEditing && (
                    <Button onClick={() => handleSaveInvoice(selectedInvoice)}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Invoice Template */}
              <InvoiceTemplate
                invoice={selectedInvoice}
                template={templateSettings}
                isEditable={isEditing}
                onSave={handleSaveInvoice}
                onPrint={handlePrint}
                onDownload={handleDownload}
                onEmail={() => handleEmail('invoice')}
              />

              {/* Thermal Printer Dialog */}
              {showThermalPrinter && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold">Thermal Printer (80mm)</h2>
                      <Button
                        variant="outline"
                        onClick={() => setShowThermalPrinter(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <ThermalPrinter80mm
                      receiptData={{
                        businessInfo: {
                          name: businessInfo.name,
                          address: businessInfo.address,
                          phone: businessInfo.phone,
                          email: businessInfo.email,
                          taxId: businessInfo.taxId
                        },
                        receiptInfo: {
                          receiptNumber: selectedInvoice.invoiceNumber,
                          date: new Date(selectedInvoice.date).toLocaleDateString(),
                          time: new Date(selectedInvoice.date).toLocaleTimeString(),
                          cashier: "System",
                          paymentMethod: selectedInvoice.payments[0]?.method || "cash",
                          reference: selectedInvoice.payments[0]?.reference
                        },
                        customer: selectedInvoice.customer.name ? {
                          name: selectedInvoice.customer.name,
                          phone: selectedInvoice.customer.phone,
                          email: selectedInvoice.customer.email,
                          loyaltyPoints: selectedInvoice.customer.loyaltyPoints
                        } : undefined,
                        items: selectedInvoice.items.map(item => ({
                          name: item.name,
                          quantity: item.quantity,
                          unitPrice: item.unitPrice,
                          totalPrice: item.totalPrice,
                          discount: item.discount,
                          sku: item.sku
                        })),
                        summary: {
                          subtotal: selectedInvoice.subtotal,
                          discount: selectedInvoice.totalDiscount,
                          tax: selectedInvoice.totalTax,
                          total: selectedInvoice.totalAmount,
                          paid: selectedInvoice.paidAmount,
                          change: selectedInvoice.paidAmount > selectedInvoice.totalAmount ? 
                            selectedInvoice.paidAmount - selectedInvoice.totalAmount : 0
                        },
                        footer: {
                          thankYou: "Thank you for your business!",
                          returnPolicy: "Return within 7 days with receipt",
                          contact: `${businessInfo.phone} | ${businessInfo.email}`,
                          website: businessInfo.website
                        }
                      }}
                      onPrintComplete={() => setShowThermalPrinter(false)}
                      onError={(error) => {
                        alert(`Print error: ${error}`)
                        setShowThermalPrinter(false)
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoice Selected</h3>
                  <p className="text-gray-500 mb-4">Select an invoice from the list to view or edit it</p>
                  <Button onClick={handleCreateInvoice}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialog.isOpen} onOpenChange={(open) => setEmailDialog({ ...emailDialog, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send {emailDialog.emailType === 'invoice' ? 'Invoice' : 
                     emailDialog.emailType === 'receipt' ? 'Receipt' :
                     emailDialog.emailType === 'reminder' ? 'Payment Reminder' : 'Thank You'}
            </DialogTitle>
            <DialogDescription>
              Send this {emailDialog.emailType} to your customer via email
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>

            {emailDialog.invoice && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{emailDialog.invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-600">
                  {emailDialog.invoice.customer.name} • {formatPrice(emailDialog.invoice.totalAmount)}
                </p>
              </div>
            )}

            <Alert>
              <AlertDescription>
                The invoice will be attached as a PDF file and a formatted email will be sent to the customer.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog({ ...emailDialog, isOpen: false })}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={!emailAddress}>
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}