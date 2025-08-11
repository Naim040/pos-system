"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { 
  Printer, 
  Settings, 
  Plus, 
  Trash2, 
  TestTube, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
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
  ipAddress?: string
  port?: number
  paperSize: '58mm' | '80mm' | 'a4' | 'letter'
  isDefault: boolean
  isEnabled: boolean
  status: 'online' | 'offline' | 'error'
  lastUsed: string
  templateId?: string
}

interface PrintTemplate {
  id: string
  name: string
  type: 'receipt' | 'invoice' | 'label' | 'report'
  content: string
  paperSize: '58mm' | '80mm' | 'a4' | 'letter'
  isDefault: boolean
  variables: string[]
}

interface PrintJob {
  id: string
  printerId: string
  templateId: string
  data: any
  status: 'pending' | 'printing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  error?: string
}

export default function BillPrinterManagement() {
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [templates, setTemplates] = useState<PrintTemplate[]>([])
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterConfig | null>(null)
  const [isAddingPrinter, setIsAddingPrinter] = useState(false)
  const [isEditingTemplate, setIsEditingTemplate] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Mock data for demonstration
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
        status: 'online',
        lastUsed: new Date().toISOString(),
        templateId: '1'
      },
      {
        id: '2',
        name: 'Kitchen Printer',
        type: 'thermal',
        connection: 'network',
        ipAddress: '192.168.1.100',
        port: 9100,
        paperSize: '58mm',
        isDefault: false,
        isEnabled: true,
        status: 'online',
        lastUsed: new Date(Date.now() - 3600000).toISOString(),
        templateId: '2'
      },
      {
        id: '3',
        name: 'Invoice Printer',
        type: 'laser',
        connection: 'network',
        ipAddress: '192.168.1.101',
        port: 9100,
        paperSize: 'a4',
        isDefault: false,
        isEnabled: false,
        status: 'offline',
        lastUsed: new Date(Date.now() - 86400000).toISOString(),
        templateId: '3'
      }
    ]

    const mockTemplates: PrintTemplate[] = [
      {
        id: '1',
        name: 'Standard Receipt',
        type: 'receipt',
        content: `
          <div class="receipt">
            <div class="header">
              <div class="store-name">\${storeName}</div>
              <div class="store-address">\${storeAddress}</div>
              <div class="store-phone">\${storePhone}</div>
            </div>
            <div class="receipt-info">
              <div>Receipt #: \${receiptId}</div>
              <div>Date: \${date}</div>
              <div>Time: \${time}</div>
              <div>Cashier: \${cashier}</div>
              \${customer ? \`<div>Customer: \${customer}</div>\` : ''}
            </div>
            <div class="items">
              \${items.map(item => \`
                <div class="item">
                  <div>\${item.name} (\${item.quantity}x $\${item.price})</div>
                  <div>$\${item.total}</div>
                </div>
              \`).join('')}
            </div>
            <div class="totals">
              <div>Subtotal: $\${subtotal}</div>
              <div>Tax: $\${tax}</div>
              \${discount ? \`<div>Discount: -$\${discount}</div>\` : ''}
              <div class="total">TOTAL: $\${total}</div>
              <div>Payment: \${paymentMethod}</div>
            </div>
            <div class="footer">
              <div>Thank you for your business!</div>
              <div>Receipt ID: \${receiptId}</div>
            </div>
          </div>
        `,
        paperSize: '80mm',
        isDefault: true,
        variables: ['storeName', 'storeAddress', 'storePhone', 'receiptId', 'date', 'time', 'cashier', 'customer', 'items', 'subtotal', 'tax', 'discount', 'total', 'paymentMethod', 'price']
      },
      {
        id: '2',
        name: 'Kitchen Order',
        type: 'receipt',
        content: `
          <div class="kitchen-order">
            <div class="header">KITCHEN ORDER</div>
            <div class="order-info">
              <div>Order #: \${orderId}</div>
              <div>Time: \${time}</div>
              <div>Table: \${table}</div>
            </div>
            <div class="items">
              \${items.map(item => \`
                <div class="item">
                  <div>\${item.quantity}x \${item.name}</div>
                  \${item.notes ? \`<div class="notes">Notes: \${item.notes}</div>\` : ''}
                </div>
              \`).join('')}
            </div>
          </div>
        `,
        paperSize: '58mm',
        isDefault: false,
        variables: ['orderId', 'time', 'table', 'items', 'quantity', 'name', 'notes']
      },
      {
        id: '3',
        name: 'Invoice Template',
        type: 'invoice',
        content: `
          <div class="invoice">
            <div class="header">
              <h1>INVOICE</h1>
              <div class="company-info">
                <div>\${companyName}</div>
                <div>\${companyAddress}</div>
                <div>\${companyPhone}</div>
              </div>
            </div>
            <div class="invoice-info">
              <div>Invoice #: \${invoiceId}</div>
              <div>Date: \${date}</div>
              <div>Due Date: \${dueDate}</div>
            </div>
            <div class="customer-info">
              <div>Bill To:</div>
              <div>\${customerName}</div>
              <div>\${customerAddress}</div>
              <div>\${customerPhone}</div>
            </div>
            <div class="items">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  \${items.map(item => \`
                    <tr>
                      <td>\${item.name}</td>
                      <td>\${item.quantity}</td>
                      <td>$\${item.price}</td>
                      <td>$\${item.total}</td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
            <div class="totals">
              <div>Subtotal: $\${subtotal}</div>
              <div>Tax: $\${tax}</div>
              \${discount ? \`<div>Discount: -$\${discount}</div>\` : ''}
              <div class="total">TOTAL: $\${total}</div>
            </div>
          </div>
        `,
        paperSize: 'a4',
        isDefault: false,
        variables: ['companyName', 'companyAddress', 'companyPhone', 'invoiceId', 'date', 'dueDate', 'customerName', 'customerAddress', 'customerPhone', 'items', 'subtotal', 'tax', 'discount', 'total', 'price']
      }
    ]

    const mockPrintJobs: PrintJob[] = [
      {
        id: '1',
        printerId: '1',
        templateId: '1',
        data: { receiptId: '12345', total: 25.99 },
        status: 'completed',
        createdAt: new Date(Date.now() - 300000).toISOString(),
        completedAt: new Date(Date.now() - 295000).toISOString()
      },
      {
        id: '2',
        printerId: '2',
        templateId: '2',
        data: { orderId: '67890', items: [] },
        status: 'printing',
        createdAt: new Date(Date.now() - 60000).toISOString()
      }
    ]

    setPrinters(mockPrinters)
    setTemplates(mockTemplates)
    setPrintJobs(mockPrintJobs)
    setSelectedPrinter(mockPrinters.find(p => p.isDefault) || null)
  }, [])

  const handleTestPrinter = async (printerId: string) => {
    setLoading(true)
    try {
      // Simulate printer test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setPrinters(prev => prev.map(p => 
        p.id === printerId 
          ? { ...p, status: 'online', lastUsed: new Date().toISOString() }
          : p
      ))
      
      toast({
        title: "Printer test successful",
        description: "Test page printed successfully",
      })
    } catch (error) {
      setPrinters(prev => prev.map(p => 
        p.id === printerId 
          ? { ...p, status: 'error' }
          : p
      ))
      
      toast({
        title: "Printer test failed",
        description: "Failed to print test page",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefaultPrinter = (printerId: string) => {
    setPrinters(prev => prev.map(p => ({
      ...p,
      isDefault: p.id === printerId
    })))
    
    const printer = printers.find(p => p.id === printerId)
    if (printer) {
      setSelectedPrinter(printer)
      toast({
        title: "Default printer updated",
        description: `${printer.name} is now the default printer`,
      })
    }
  }

  const handleTogglePrinter = (printerId: string, enabled: boolean) => {
    setPrinters(prev => prev.map(p => 
      p.id === printerId 
        ? { ...p, isEnabled: enabled }
        : p
    ))
    
    const printer = printers.find(p => p.id === printerId)
    if (printer) {
      toast({
        title: `Printer ${enabled ? 'enabled' : 'disabled'}`,
        description: `${printer.name} has been ${enabled ? 'enabled' : 'disabled'}`,
      })
    }
  }

  const handleDeletePrinter = (printerId: string) => {
    setPrinters(prev => prev.filter(p => p.id !== printerId))
    
    if (selectedPrinter?.id === printerId) {
      const newDefault = printers.find(p => p.id !== printerId && p.isEnabled)
      if (newDefault) {
        handleSetDefaultPrinter(newDefault.id)
      } else {
        setSelectedPrinter(null)
      }
    }
    
    toast({
      title: "Printer deleted",
      description: "Printer configuration removed",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getConnectionIcon = (connection: string) => {
    switch (connection) {
      case 'network':
        return <Wifi className="h-4 w-4" />
      case 'usb':
        return <Package className="h-4 w-4" />
      case 'bluetooth':
        return <Wifi className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bill Printer Management</h2>
          <p className="text-gray-600">Manage printers, templates, and print jobs</p>
        </div>
        <Dialog open={isAddingPrinter} onOpenChange={setIsAddingPrinter}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Printer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Printer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="printer-name">Printer Name</Label>
                <Input id="printer-name" placeholder="Enter printer name" />
              </div>
              <div>
                <Label htmlFor="printer-type">Printer Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select printer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">Thermal</SelectItem>
                    <SelectItem value="inkjet">Inkjet</SelectItem>
                    <SelectItem value="laser">Laser</SelectItem>
                    <SelectItem value="dot_matrix">Dot Matrix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="connection">Connection Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usb">USB</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paper-size">Paper Size</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select paper size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm (Thermal)</SelectItem>
                    <SelectItem value="80mm">80mm (Thermal)</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingPrinter(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddingPrinter(false)}>
                  Add Printer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="printers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="printers">Printers</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="jobs">Print Jobs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="printers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {printers.map((printer) => (
              <Card key={printer.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Printer className="h-5 w-5 mr-2" />
                      {printer.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(printer.status)}
                      {printer.isDefault && (
                        <Badge variant="default">Default</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="capitalize">{printer.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Connection:</span>
                      <div className="flex items-center space-x-1">
                        {getConnectionIcon(printer.connection)}
                        <span className="capitalize">{printer.connection}</span>
                      </div>
                    </div>
                    {printer.ipAddress && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">IP Address:</span>
                        <span>{printer.ipAddress}:{printer.port}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Paper Size:</span>
                      <span>{printer.paperSize}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={`capitalize ${printer.status === 'online' ? 'text-green-600' : printer.status === 'error' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {printer.status}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Enabled</span>
                    <Switch
                      checked={printer.isEnabled}
                      onCheckedChange={(checked) => handleTogglePrinter(printer.id, checked)}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestPrinter(printer.id)}
                      disabled={loading || !printer.isEnabled}
                      className="flex-1"
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    {!printer.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefaultPrinter(printer.id)}
                        disabled={!printer.isEnabled}
                        className="flex-1"
                      >
                        Set Default
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePrinter(printer.id)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    {template.name}
                    {template.isDefault && (
                      <Badge variant="default" className="ml-2">Default</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <Badge variant="outline" className="capitalize">
                      {template.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Paper Size:</span>
                    <span>{template.paperSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Variables:</span>
                    <span>{template.variables.length}</span>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-sm font-medium">Preview:</Label>
                    <ScrollArea className="h-32 w-full border rounded p-2 mt-2">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {template.content.substring(0, 200)}...
                      </pre>
                    </ScrollArea>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <TestTube className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Print Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {printJobs.map((job) => {
                  const printer = printers.find(p => p.id === job.printerId)
                  const template = templates.find(t => t.id === job.templateId)
                  
                  return (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          job.status === 'completed' ? 'bg-green-500' :
                          job.status === 'printing' ? 'bg-blue-500' :
                          job.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <div className="font-medium">
                            {template?.name || 'Unknown Template'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {printer?.name || 'Unknown Printer'} • 
                            {new Date(job.createdAt).toLocaleString()}
                          </div>
                          {job.error && (
                            <div className="text-sm text-red-600">
                              Error: {job.error}
                            </div>
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
                        {job.completedAt && (
                          <span className="text-sm text-gray-600">
                            {new Date(job.completedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {printJobs.length === 0 && (
                  <div className="text-center py-8 text-gray-600">
                    No print jobs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-print receipts</Label>
                    <p className="text-sm text-gray-600">Automatically print receipts after sales</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Print customer copy</Label>
                    <p className="text-sm text-gray-600">Print additional copy for customer</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Print kitchen orders</Label>
                    <p className="text-sm text-gray-600">Send orders to kitchen printer</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="retry-count">Print Retry Count</Label>
                  <Input id="retry-count" type="number" defaultValue="3" min="1" max="10" />
                </div>
                <div>
                  <Label htmlFor="timeout">Print Timeout (seconds)</Label>
                  <Input id="timeout" type="number" defaultValue="30" min="5" max="300" />
                </div>
                <div>
                  <Label htmlFor="buffer-size">Print Buffer Size</Label>
                  <Input id="buffer-size" type="number" defaultValue="100" min="10" max="1000" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}