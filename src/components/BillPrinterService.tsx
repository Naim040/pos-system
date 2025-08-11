"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Printer, 
  Settings, 
  Download, 
  Mail, 
  Eye, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Receipt,
  Package,
  Store
} from 'lucide-react'

interface PrinterConfig {
  id: string
  name: string
  type: 'thermal' | 'inkjet' | 'laser' | 'dot_matrix'
  connection: 'usb' | 'network' | 'bluetooth'
  paperSize: '58mm' | '80mm' | 'a4' | 'letter'
  isDefault: boolean
  isEnabled: boolean
  status: 'online' | 'offline' | 'error'
}

interface PrintJob {
  id: string
  type: 'receipt' | 'invoice' | 'kitchen_order' | 'label' | 'report'
  data: any
  priority: 'low' | 'normal' | 'high'
  status: 'pending' | 'printing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  printerId?: string
  error?: string
  retryCount: number
}

interface BillPrinterServiceProps {
  saleData?: any
  invoiceData?: any
  kitchenOrderData?: any
  onPrintComplete?: (jobId: string) => void
  onPrintError?: (jobId: string, error: string) => void
}

export default function BillPrinterService({ 
  saleData, 
  invoiceData, 
  kitchenOrderData, 
  onPrintComplete, 
  onPrintError 
}: BillPrinterServiceProps) {
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewType, setPreviewType] = useState<'receipt' | 'invoice' | 'kitchen_order'>('receipt')
  const { toast } = useToast()

  // Enhanced printer status monitoring
  useEffect(() => {
    const monitorPrinterStatus = () => {
      setPrinters(prev => prev.map(printer => {
        // Simulate random status changes for demo
        const shouldChange = Math.random() < 0.1 // 10% chance of status change
        if (shouldChange && printer.isEnabled) {
          const statuses: ('online' | 'offline' | 'error')[] = ['online', 'offline', 'error']
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)]
          return { ...printer, status: newStatus }
        }
        return printer
      }))
    }

    const statusInterval = setInterval(monitorPrinterStatus, 10000) // Check every 10 seconds
    return () => clearInterval(statusInterval)
  }, [])

  // Auto-retry failed jobs with exponential backoff
  useEffect(() => {
    const retryFailedJobs = () => {
      const now = Date.now()
      setPrintQueue(prev => prev.map(job => {
        if (job.status === 'failed' && job.retryCount < 3) {
          const timeSinceFailure = now - new Date(job.createdAt).getTime()
          const backoffTime = Math.pow(2, job.retryCount) * 5000 // 5s, 10s, 20s
          
          if (timeSinceFailure >= backoffTime) {
            return { ...job, status: 'pending' }
          }
        }
        return job
      }))
    }

    const retryInterval = setInterval(retryFailedJobs, 5000) // Check every 5 seconds
    return () => clearInterval(retryInterval)
  }, [])

  // Initialize mock printers
  useEffect(() => {
    const mockPrinters: PrinterConfig[] = [
      {
        id: '1',
        name: 'Main Receipt Printer',
        type: 'thermal',
        connection: 'usb',
        paperSize: '80mm',
        isDefault: true,
        isEnabled: true,
        status: 'online'
      },
      {
        id: '2',
        name: 'Kitchen Printer',
        type: 'thermal',
        connection: 'network',
        paperSize: '58mm',
        isDefault: false,
        isEnabled: true,
        status: 'online'
      },
      {
        id: '3',
        name: 'Invoice Printer',
        type: 'laser',
        connection: 'network',
        paperSize: 'a4',
        isDefault: false,
        isEnabled: true,
        status: 'online'
      }
    ]
    setPrinters(mockPrinters)
    const defaultPrinter = mockPrinters.find(p => p.isDefault)
    if (defaultPrinter) {
      setSelectedPrinter(defaultPrinter.id)
    }
  }, [])

  // Process print queue
  useEffect(() => {
    const processQueue = async () => {
      const pendingJobs = printQueue.filter(job => job.status === 'pending')
      if (pendingJobs.length === 0 || isPrinting) return

      const nextJob = pendingJobs[0]
      setIsPrinting(true)

      try {
        // Simulate printing process
        await new Promise(resolve => setTimeout(resolve, 2000))

        setPrintQueue(prev => prev.map(job => 
          job.id === nextJob.id 
            ? { ...job, status: 'completed', completedAt: new Date().toISOString() }
            : job
        ))

        toast({
          title: "Print job completed",
          description: `${nextJob.type} printed successfully`,
        })

        if (onPrintComplete) {
          onPrintComplete(nextJob.id)
        }
      } catch (error) {
        const errorMessage = "Failed to print document"
        
        setPrintQueue(prev => prev.map(job => 
          job.id === nextJob.id 
            ? { 
                ...job, 
                status: job.retryCount < 3 ? 'pending' : 'failed', 
                error: errorMessage,
                retryCount: job.retryCount + 1
              }
            : job
        ))

        toast({
          title: "Print job failed",
          description: errorMessage,
          variant: "destructive"
        })

        if (onPrintError) {
          onPrintError(nextJob.id, errorMessage)
        }
      } finally {
        setIsPrinting(false)
      }
    }

    const interval = setInterval(processQueue, 3000)
    return () => clearInterval(interval)
  }, [printQueue, isPrinting, onPrintComplete, onPrintError, toast])

  const generateReceiptContent = (data: any) => {
    const subtotal = data.totalAmount || 0
    const tax = data.taxAmount || 0
    const discount = data.discount || 0
    const total = subtotal + tax - discount

    return `
      <div class="receipt bg-white p-6 font-mono text-sm" style="max-width: 300px; margin: 0 auto;">
        <div class="header text-center mb-4" style="border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
          <div class="font-bold text-lg">POS SYSTEM</div>
          <div class="text-xs text-gray-600">123 Business Street</div>
          <div class="text-xs text-gray-600">City, State 12345</div>
          <div class="text-xs text-gray-600">Phone: (555) 123-4567</div>
        </div>

        <div class="text-left mb-4">
          <div class="flex justify-between">
            <span>Receipt #:</span>
            <span>${data.id?.slice(-8) || 'N/A'}</span>
          </div>
          <div class="flex justify-between">
            <span>Date:</span>
            <span>${new Date(data.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
          <div class="flex justify-between">
            <span>Time:</span>
            <span>${new Date(data.createdAt || Date.now()).toLocaleTimeString()}</span>
          </div>
          <div class="flex justify-between">
            <span>Cashier:</span>
            <span>${data.user?.name || 'N/A'}</span>
          </div>
          ${data.customerName ? `
          <div class="flex justify-between">
            <span>Customer:</span>
            <span>${data.customerName}</span>
          </div>` : ''}
        </div>

        <div style="border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; margin: 10px 0; padding: 10px 0;">
          ${data.saleItems?.map((item: any) => `
          <div class="flex justify-between mb-2">
            <div>
              <div>${item.product?.name || 'Unknown'}</div>
              <div class="text-xs text-gray-600">
                ${item.quantity} x $${item.unitPrice?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>$${item.totalPrice?.toFixed(2) || '0.00'}</div>
          </div>`).join('') || ''}
        </div>

        <div style="border-top: 1px dashed #ccc; padding-top: 10px;">
          <div class="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          ${tax > 0 ? `
          <div class="flex justify-between mb-1">
            <span>Tax:</span>
            <span>$${tax.toFixed(2)}</span>
          </div>` : ''}
          ${discount > 0 ? `
          <div class="flex justify-between mb-1">
            <span>Discount:</span>
            <span>-$${discount.toFixed(2)}</span>
          </div>` : ''}
          <div class="flex justify-between font-bold text-lg">
            <span>TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          <div class="flex justify-between mt-2 text-xs text-gray-600">
            <span>Payment:</span>
            <span class="uppercase">${data.paymentMethod || 'N/A'}</span>
          </div>
        </div>

        <div class="text-center mt-6" style="border-top: 1px dashed #ccc; padding-top: 10px;">
          <div class="mb-2">Thank you for your business!</div>
          <div class="text-xs">
            Returns accepted within 30 days
            <br />
            with original receipt
          </div>
          <div class="text-xs mt-2">
            Receipt ID: ${data.id?.slice(-8) || 'N/A'}
          </div>
        </div>
      </div>
    `
  }

  const generateInvoiceContent = (data: any) => {
    const subtotal = data.totalAmount || 0
    const tax = data.taxAmount || 0
    const discount = data.discount || 0
    const total = subtotal + tax - discount

    return `
      <div class="invoice bg-white p-8" style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div class="header mb-8">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">INVOICE</h1>
          <div class="company-info text-sm">
            <div><strong>POS System</strong></div>
            <div>123 Business Street</div>
            <div>City, State 12345</div>
            <div>Phone: (555) 123-4567</div>
          </div>
        </div>

        <div class="invoice-info mb-6">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Invoice #:</strong> ${data.id?.slice(-8) || 'N/A'}<br>
              <strong>Date:</strong> ${new Date(data.createdAt || Date.now()).toLocaleDateString()}<br>
              <strong>Due Date:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
            <div>
              <strong>Bill To:</strong><br>
              ${data.customerName || 'N/A'}<br>
              ${data.customerEmail || ''}<br>
              ${data.customerPhone || ''}
            </div>
          </div>
        </div>

        <div class="items mb-6">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #333;">
                <th style="text-align: left; padding: 10px;">Description</th>
                <th style="text-align: center; padding: 10px;">Quantity</th>
                <th style="text-align: right; padding: 10px;">Price</th>
                <th style="text-align: right; padding: 10px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.saleItems?.map((item: any) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${item.product?.name || 'Unknown'}</td>
                <td style="text-align: center; padding: 10px;">${item.quantity}</td>
                <td style="text-align: right; padding: 10px;">$${item.unitPrice?.toFixed(2) || '0.00'}</td>
                <td style="text-align: right; padding: 10px;">$${item.totalPrice?.toFixed(2) || '0.00'}</td>
              </tr>`).join('') || ''}
            </tbody>
          </table>
        </div>

        <div class="totals ml-auto" style="width: 300px;">
          <div class="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          ${tax > 0 ? `
          <div class="flex justify-between mb-2">
            <span>Tax:</span>
            <span>$${tax.toFixed(2)}</span>
          </div>` : ''}
          ${discount > 0 ? `
          <div class="flex justify-between mb-2">
            <span>Discount:</span>
            <span>-$${discount.toFixed(2)}</span>
          </div>` : ''}
          <div class="flex justify-between font-bold text-lg" style="border-top: 2px solid #333; padding-top: 10px;">
            <span>TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer mt-8 text-center text-sm text-gray-600">
          <div>Thank you for your business!</div>
          <div>Payment terms: Net 30 days</div>
          <div>Invoice ID: ${data.id?.slice(-8) || 'N/A'}</div>
        </div>
      </div>
    `
  }

  const generateKitchenOrderContent = (data: any) => {
    return `
      <div class="kitchen-order bg-white p-6 font-mono text-sm" style="max-width: 250px; margin: 0 auto;">
        <div class="header text-center mb-4" style="border-bottom: 2px solid #000; padding-bottom: 10px;">
          <div class="font-bold text-lg">KITCHEN ORDER</div>
          <div class="text-sm">Order #${data.id?.slice(-8) || 'N/A'}</div>
          <div class="text-sm">${new Date(data.createdAt || Date.now()).toLocaleTimeString()}</div>
          ${data.table ? `<div class="text-sm">Table: ${data.table}</div>` : ''}
        </div>

        <div class="items">
          ${data.saleItems?.map((item: any) => `
          <div class="item mb-3" style="border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
            <div class="font-bold">${item.quantity}x ${item.product?.name || 'Unknown'}</div>
            ${item.notes ? `<div class="text-xs text-gray-600 mt-1">Notes: ${item.notes}</div>` : ''}
          </div>`).join('') || ''}
        </div>

        <div class="footer text-center mt-4 text-xs text-gray-600">
          <div>Please prepare order promptly</div>
        </div>
      </div>
    `
  }

  const addToPrintQueue = (type: 'receipt' | 'invoice' | 'kitchen_order', data: any, priority: 'low' | 'normal' | 'high' = 'normal') => {
    const newJob: PrintJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0
    }

    setPrintQueue(prev => [...prev, newJob])
    
    toast({
      title: "Print job added to queue",
      description: `${type} will be printed shortly`,
    })
  }

  const handlePrintReceipt = () => {
    if (!saleData) {
      toast({
        title: "No sale data",
        description: "Please provide sale data to print receipt",
        variant: "destructive"
      })
      return
    }
    addToPrintQueue('receipt', saleData, 'high')
  }

  const handlePrintInvoice = () => {
    if (!invoiceData) {
      toast({
        title: "No invoice data",
        description: "Please provide invoice data to print invoice",
        variant: "destructive"
      })
      return
    }
    addToPrintQueue('invoice', invoiceData, 'normal')
  }

  const handlePrintKitchenOrder = () => {
    if (!kitchenOrderData) {
      toast({
        title: "No kitchen order data",
        description: "Please provide kitchen order data to print order",
        variant: "destructive"
      })
      return
    }
    addToPrintQueue('kitchen_order', kitchenOrderData, 'high')
  }

  const handlePreview = (type: 'receipt' | 'invoice' | 'kitchen_order') => {
    let content = ''
    let data = saleData

    switch (type) {
      case 'receipt':
        content = generateReceiptContent(saleData || {})
        data = saleData
        break
      case 'invoice':
        content = generateInvoiceContent(invoiceData || saleData || {})
        data = invoiceData || saleData
        break
      case 'kitchen_order':
        content = generateKitchenOrderContent(kitchenOrderData || saleData || {})
        data = kitchenOrderData || saleData
        break
    }

    setPreviewContent(content)
    setPreviewType(type)
    setShowPreview(true)
  }

  const clearPrintQueue = () => {
    setPrintQueue([])
    toast({
      title: "Print queue cleared",
      description: "All pending print jobs have been removed",
    })
  }

  const retryFailedJobs = () => {
    setPrintQueue(prev => prev.map(job => 
      job.status === 'failed' 
        ? { ...job, status: 'pending', retryCount: 0, error: undefined }
        : job
    ))
    
    toast({
      title: "Retrying failed jobs",
      description: "Failed print jobs have been requeued",
    })
  }

  const getJobIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return <Receipt className="h-4 w-4" />
      case 'invoice':
        return <FileText className="h-4 w-4" />
      case 'kitchen_order':
        return <Package className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'printing':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Enhanced printer management functions
  const togglePrinter = (printerId: string) => {
    setPrinters(prev => prev.map(printer => 
      printer.id === printerId 
        ? { ...printer, isEnabled: !printer.isEnabled }
        : printer
    ))
    
    const printer = printers.find(p => p.id === printerId)
    if (printer) {
      toast({
        title: `Printer ${printer.isEnabled ? 'Disabled' : 'Enabled'}`,
        description: `${printer.name} has been ${printer.isEnabled ? 'disabled' : 'enabled'}`,
      })
    }
  }

  const setDefaultPrinter = (printerId: string) => {
    setPrinters(prev => prev.map(printer => ({
      ...printer,
      isDefault: printer.id === printerId
    })))
    
    const printer = printers.find(p => p.id === printerId)
    if (printer) {
      setSelectedPrinter(printerId)
      toast({
        title: "Default Printer Changed",
        description: `${printer.name} is now the default printer`,
      })
    }
  }

  const testPrinter = async (printerId: string) => {
    const printer = printers.find(p => p.id === printerId)
    if (!printer || !printer.isEnabled) {
      toast({
        title: "Printer Test Failed",
        description: "Printer is not available or disabled",
        variant: "destructive"
      })
      return
    }

    // Add test print job
    const testJob: PrintJob = {
      id: `test_${Date.now()}`,
      type: 'receipt',
      data: {
        id: 'TEST_RECEIPT',
        createdAt: new Date().toISOString(),
        user: { name: 'System Test' },
        totalAmount: 0.00,
        taxAmount: 0.00,
        discount: 0.00,
        paymentMethod: 'test',
        saleItems: [
          {
            product: { name: 'Test Print' },
            quantity: 1,
            unitPrice: 0.00,
            totalPrice: 0.00
          }
        ]
      },
      priority: 'normal',
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0
    }

    setPrintQueue(prev => [...prev, testJob])
    
    toast({
      title: "Test Print Sent",
      description: `Test page sent to ${printer.name}`,
    })
  }

  const getPrinterStats = () => {
    const totalJobs = printQueue.length
    const pendingJobs = printQueue.filter(job => job.status === 'pending').length
    const completedJobs = printQueue.filter(job => job.status === 'completed').length
    const failedJobs = printQueue.filter(job => job.status === 'failed').length
    const onlinePrinters = printers.filter(p => p.status === 'online' && p.isEnabled).length

    return {
      totalJobs,
      pendingJobs,
      completedJobs,
      failedJobs,
      onlinePrinters,
      totalPrinters: printers.length
    }
  }

  const stats = getPrinterStats()

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Printer className="h-5 w-5 mr-2" />
              Quick Print Actions
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${stats.onlinePrinters > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{stats.onlinePrinters}/{stats.totalPrinters} printers online</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${stats.pendingJobs > 0 ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                <span>{stats.pendingJobs} pending jobs</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handlePrintReceipt}
              disabled={!saleData || isPrinting}
              className="flex items-center justify-center h-20"
            >
              <div className="text-center">
                <Receipt className="h-6 w-6 mx-auto mb-1" />
                <div>Print Receipt</div>
              </div>
            </Button>
            
            <Button
              onClick={handlePrintInvoice}
              disabled={!invoiceData && !saleData || isPrinting}
              variant="outline"
              className="flex items-center justify-center h-20"
            >
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-1" />
                <div>Print Invoice</div>
              </div>
            </Button>
            
            <Button
              onClick={handlePrintKitchenOrder}
              disabled={!kitchenOrderData && !saleData || isPrinting}
              variant="outline"
              className="flex items-center justify-center h-20"
            >
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-1" />
                <div>Kitchen Order</div>
              </div>
            </Button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Printer:</span>
                <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select printer" />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.filter(p => p.isEnabled).map((printer) => (
                      <SelectItem key={printer.id} value={printer.id}>
                        {printer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isPrinting ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isPrinting ? 'Printing...' : 'Ready'}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handlePreview('receipt')}>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Print Queue ({printQueue.filter(j => j.status === 'pending').length} pending)
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={retryFailedJobs}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry Failed
              </Button>
              <Button variant="outline" size="sm" onClick={clearPrintQueue}>
                Clear Queue
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {printQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No print jobs in queue
                </div>
              ) : (
                printQueue.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`}></div>
                      {getJobIcon(job.type)}
                      <div>
                        <div className="font-medium capitalize">{job.type.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(job.createdAt).toLocaleTimeString()}
                          {job.retryCount > 0 && (
                            <span className="ml-2 text-yellow-600">
                              (Retry {job.retryCount})
                            </span>
                          )}
                        </div>
                        {job.error && (
                          <div className="text-sm text-red-600">{job.error}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        job.status === 'completed' ? 'default' :
                        job.status === 'printing' ? 'secondary' :
                        job.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {job.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {job.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Print Preview - {previewType.replace('_', ' ').toUpperCase()}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div 
              dangerouslySetInnerHTML={{ __html: previewContent }} 
              className="bg-white border rounded"
            />
          </ScrollArea>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowPreview(false)
              switch (previewType) {
                case 'receipt':
                  handlePrintReceipt()
                  break
                case 'invoice':
                  handlePrintInvoice()
                  break
                case 'kitchen_order':
                  handlePrintKitchenOrder()
                  break
              }
            }}>
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}