"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Settings, 
  Eye, 
  Save, 
  RotateCcw,
  FileText,
  Building,
  Phone,
  Mail,
  Globe,
  MapPin,
  Percent,
  DollarSign,
  MessageSquare,
  Package,
  Receipt,
  Printer
} from 'lucide-react'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'

interface InvoiceSettings {
  businessInfo: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    taxId: string
  }
  receiptSettings: {
    header: string
    footer: string
    thankYouMessage: string
    returnPolicy: string
    customNotes: string
  }
  labels: {
    taxLabel: string
    discountLabel: string
    subtotalLabel: string
    totalLabel: string
    quantityLabel: string
    priceLabel: string
  }
  printSettings: {
    paperSize: '80mm' | '58mm' | 'A4'
    fontSize: 'small' | 'medium' | 'large'
    autoPrint: boolean
    printLogo: boolean
    printBarcode: boolean
    charactersPerLine: number
  }
  displaySettings: {
    showTaxBreakdown: boolean
    showDiscountBreakdown: boolean
    showLoyaltyPoints: boolean
    showItemSku: boolean
    showItemBarcode: boolean
  }
}

interface InvoicePreviewData {
  businessInfo: {
    name: string
    address: string
    phone: string
    email?: string
    taxId?: string
  }
  receiptInfo: {
    receiptNumber: string
    date: string
    time: string
    cashier: string
    paymentMethod: string
  }
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    discount?: number
    sku?: string
  }>
  summary: {
    subtotal: number
    discount: number
    tax: number
    total: number
    paid: number
    change?: number
  }
}

const DEFAULT_SETTINGS: InvoiceSettings = {
  businessInfo: {
    name: "Your Business Name",
    address: "123 Business Street, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "info@yourbusiness.com",
    website: "www.yourbusiness.com",
    taxId: "TAX123456789"
  },
  receiptSettings: {
    header: "OFFICIAL RECEIPT",
    footer: "Thank you for your purchase!",
    thankYouMessage: "Thank you for shopping with us!",
    returnPolicy: "Returns accepted within 7 days with original receipt",
    customNotes: "Powered by Halalzi POS"
  },
  labels: {
    taxLabel: "Tax",
    discountLabel: "Discount",
    subtotalLabel: "Subtotal",
    totalLabel: "TOTAL",
    quantityLabel: "Qty",
    priceLabel: "Price"
  },
  printSettings: {
    paperSize: '80mm',
    fontSize: 'medium',
    autoPrint: false,
    printLogo: false,
    printBarcode: true,
    charactersPerLine: 48
  },
  displaySettings: {
    showTaxBreakdown: true,
    showDiscountBreakdown: true,
    showLoyaltyPoints: true,
    showItemSku: true,
    showItemBarcode: false
  }
}

const SAMPLE_PREVIEW_DATA: InvoicePreviewData = {
  businessInfo: {
    name: "Your Business Name",
    address: "123 Business Street, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "info@yourbusiness.com",
    taxId: "TAX123456789"
  },
  receiptInfo: {
    receiptNumber: "RCP-2024-001",
    date: "12/15/2024",
    time: "14:30:25",
    cashier: "John Doe",
    paymentMethod: "Cash"
  },
  items: [
    { name: "Fresh Bread", quantity: 2, unitPrice: 3.50, totalPrice: 7.00, sku: "B001" },
    { name: "Organic Milk", quantity: 1, unitPrice: 4.25, totalPrice: 4.25, sku: "M001" },
    { name: "Chocolate Bar", quantity: 3, unitPrice: 2.99, totalPrice: 8.97, sku: "C001", discount: 0.50 }
  ],
  summary: {
    subtotal: 20.22,
    discount: 0.50,
    tax: 1.59,
    total: 21.31,
    paid: 25.00,
    change: 3.69
  }
}

export default function InvoiceSettingsEditor() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_SETTINGS)
  const [previewData, setPreviewData] = useState<InvoicePreviewData>(SAMPLE_PREVIEW_DATA)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('business')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/invoice-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data }))
      } else {
        console.error('Failed to load invoice settings:', response.status, response.statusText)
        toast({
          title: "Warning",
          description: "Could not load saved settings. Using defaults.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading invoice settings:', error)
      toast({
        title: "Warning",
        description: "Could not load saved settings. Using defaults.",
        variant: "destructive"
      })
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/invoice-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update the local state with the saved data
        setSettings(data)
        
        toast({
          title: "Settings saved",
          description: "Invoice settings have been successfully updated",
        })
      } else {
        const errorData = await response.text()
        console.error('Save error response:', errorData)
        throw new Error(`Failed to save settings: ${response.status} ${errorData}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save invoice settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all invoice settings to defaults?')) {
      setSettings(DEFAULT_SETTINGS)
      toast({
        title: "Settings reset",
        description: "Invoice settings have been reset to defaults",
      })
    }
  }

  const updateBusinessInfo = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      businessInfo: { ...prev.businessInfo, [field]: value }
    }))
  }

  const updateReceiptSettings = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      receiptSettings: { ...prev.receiptSettings, [field]: value }
    }))
  }

  const updateLabels = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      labels: { ...prev.labels, [field]: value }
    }))
  }

  const updatePrintSettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      printSettings: { ...prev.printSettings, [field]: value }
    }))
  }

  const updateDisplaySettings = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      displaySettings: { ...prev.displaySettings, [field]: value }
    }))
  }

  const getFontSize = () => {
    switch (settings.printSettings.fontSize) {
      case 'small': return '10px'
      case 'medium': return '12px'
      case 'large': return '14px'
      default: return '12px'
    }
  }

  const centerText = (text: string, width: number = settings.printSettings.charactersPerLine): string => {
    const padding = Math.floor((width - text.length) / 2)
    return ' '.repeat(Math.max(0, padding)) + text
  }

  const generateThermalPreview = (): string => {
    const currencySymbol = getCurrencySymbol()
    const { charactersPerLine } = settings.printSettings
    let content = ''

    // Header
    content += centerText(settings.receiptSettings.header.toUpperCase(), charactersPerLine) + '\n'
    content += centerText(settings.businessInfo.name.toUpperCase(), charactersPerLine) + '\n'
    content += centerText(settings.businessInfo.address, charactersPerLine) + '\n'
    content += centerText('Tel: ' + settings.businessInfo.phone, charactersPerLine) + '\n'
    if (settings.businessInfo.taxId) {
      content += centerText('TAX ID: ' + settings.businessInfo.taxId, charactersPerLine) + '\n'
    }
    content += '\n'

    // Receipt info
    content += 'No: ' + previewData.receiptInfo.receiptNumber + '\n'
    content += 'Date: ' + previewData.receiptInfo.date + '\n'
    content += 'Time: ' + previewData.receiptInfo.time + '\n'
    content += 'Cashier: ' + previewData.receiptInfo.cashier + '\n'
    content += 'Payment: ' + previewData.receiptInfo.paymentMethod.toUpperCase() + '\n'
    content += '\n'

    // Items header
    const itemHeader = 'Item'.padEnd(15) + settings.labels.quantityLabel.padEnd(6) + settings.labels.priceLabel.padEnd(8) + 'Total'
    content += itemHeader + '\n'
    content += '-'.repeat(charactersPerLine) + '\n'

    // Items
    previewData.items.forEach(item => {
      const itemName = item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name
      content += itemName.padEnd(15)
      content += item.quantity.toString().padEnd(6)
      content += currencySymbol + item.unitPrice.toFixed(2).padEnd(7)
      content += currencySymbol + item.totalPrice.toFixed(2) + '\n'
      
      if (settings.displaySettings.showItemSku && item.sku) {
        content += '  SKU: ' + item.sku + '\n'
      }
      if (item.discount && item.discount > 0) {
        content += '  ' + settings.labels.discountLabel + ': -' + currencySymbol + item.discount.toFixed(2) + '\n'
      }
    })

    content += '-'.repeat(charactersPerLine) + '\n'

    // Summary
    content += settings.labels.subtotalLabel + ':'.padEnd(25) + currencySymbol + previewData.summary.subtotal.toFixed(2) + '\n'
    if (previewData.summary.discount > 0) {
      content += settings.labels.discountLabel + ':'.padEnd(25) + '-' + currencySymbol + previewData.summary.discount.toFixed(2) + '\n'
    }
    if (previewData.summary.tax > 0) {
      content += settings.labels.taxLabel + ':'.padEnd(25) + currencySymbol + previewData.summary.tax.toFixed(2) + '\n'
    }
    content += settings.labels.totalLabel + ':'.padEnd(25) + currencySymbol + previewData.summary.total.toFixed(2) + '\n'
    content += 'Paid:'.padEnd(25) + currencySymbol + previewData.summary.paid.toFixed(2) + '\n'
    
    if (previewData.summary.change && previewData.summary.change > 0) {
      content += 'Change:'.padEnd(25) + currencySymbol + previewData.summary.change.toFixed(2) + '\n'
    }

    content += '\n'

    // Footer
    if (settings.receiptSettings.thankYouMessage) {
      content += centerText(settings.receiptSettings.thankYouMessage, charactersPerLine) + '\n'
    }
    if (settings.receiptSettings.returnPolicy) {
      content += centerText(settings.receiptSettings.returnPolicy, charactersPerLine) + '\n'
    }
    content += '\n'
    if (settings.receiptSettings.customNotes) {
      content += centerText(settings.receiptSettings.customNotes, charactersPerLine) + '\n'
    }

    return content
  }

  const thermalPreview = generateThermalPreview()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Invoice Settings</h2>
          <p className="text-gray-600">Customize your invoice and receipt layout</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={saveSettings}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="receipt">Receipt</TabsTrigger>
              <TabsTrigger value="labels">Labels</TabsTrigger>
              <TabsTrigger value="print">Print</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
            </TabsList>

            {/* Business Information */}
            <TabsContent value="business" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Configure your business details that appear on invoices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={settings.businessInfo.name}
                      onChange={(e) => updateBusinessInfo('name', e.target.value)}
                      placeholder="Enter business name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessAddress">Address</Label>
                    <Textarea
                      id="businessAddress"
                      value={settings.businessInfo.address}
                      onChange={(e) => updateBusinessInfo('address', e.target.value)}
                      placeholder="Enter business address"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessPhone">Phone Number</Label>
                    <Input
                      id="businessPhone"
                      value={settings.businessInfo.phone}
                      onChange={(e) => updateBusinessInfo('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessEmail">Email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={settings.businessInfo.email}
                      onChange={(e) => updateBusinessInfo('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessWebsite">Website</Label>
                    <Input
                      id="businessWebsite"
                      value={settings.businessInfo.website}
                      onChange={(e) => updateBusinessInfo('website', e.target.value)}
                      placeholder="Enter website URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessTaxId">Tax ID</Label>
                    <Input
                      id="businessTaxId"
                      value={settings.businessInfo.taxId}
                      onChange={(e) => updateBusinessInfo('taxId', e.target.value)}
                      placeholder="Enter tax ID"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Receipt Settings */}
            <TabsContent value="receipt" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="w-5 h-5 mr-2" />
                    Receipt Content
                  </CardTitle>
                  <CardDescription>
                    Customize the text that appears on receipts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="receiptHeader">Receipt Header</Label>
                    <Input
                      id="receiptHeader"
                      value={settings.receiptSettings.header}
                      onChange={(e) => updateReceiptSettings('header', e.target.value)}
                      placeholder="e.g., OFFICIAL RECEIPT"
                    />
                  </div>
                  <div>
                    <Label htmlFor="thankYouMessage">Thank You Message</Label>
                    <Textarea
                      id="thankYouMessage"
                      value={settings.receiptSettings.thankYouMessage}
                      onChange={(e) => updateReceiptSettings('thankYouMessage', e.target.value)}
                      placeholder="e.g., Thank you for shopping with us!"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="returnPolicy">Return Policy</Label>
                    <Textarea
                      id="returnPolicy"
                      value={settings.receiptSettings.returnPolicy}
                      onChange={(e) => updateReceiptSettings('returnPolicy', e.target.value)}
                      placeholder="e.g., Returns accepted within 7 days with original receipt"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="receiptFooter">Footer Message</Label>
                    <Textarea
                      id="receiptFooter"
                      value={settings.receiptSettings.footer}
                      onChange={(e) => updateReceiptSettings('footer', e.target.value)}
                      placeholder="e.g., Thank you for your purchase!"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customNotes">Custom Notes</Label>
                    <Textarea
                      id="customNotes"
                      value={settings.receiptSettings.customNotes}
                      onChange={(e) => updateReceiptSettings('customNotes', e.target.value)}
                      placeholder="e.g., Powered by Halalzi POS"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Labels */}
            <TabsContent value="labels" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Invoice Labels
                  </CardTitle>
                  <CardDescription>
                    Customize the labels used on invoices and receipts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="taxLabel">Tax Label</Label>
                    <Input
                      id="taxLabel"
                      value={settings.labels.taxLabel}
                      onChange={(e) => updateLabels('taxLabel', e.target.value)}
                      placeholder="e.g., Tax, VAT, GST"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountLabel">Discount Label</Label>
                    <Input
                      id="discountLabel"
                      value={settings.labels.discountLabel}
                      onChange={(e) => updateLabels('discountLabel', e.target.value)}
                      placeholder="e.g., Discount, Savings"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtotalLabel">Subtotal Label</Label>
                    <Input
                      id="subtotalLabel"
                      value={settings.labels.subtotalLabel}
                      onChange={(e) => updateLabels('subtotalLabel', e.target.value)}
                      placeholder="e.g., Subtotal, Sub-Total"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalLabel">Total Label</Label>
                    <Input
                      id="totalLabel"
                      value={settings.labels.totalLabel}
                      onChange={(e) => updateLabels('totalLabel', e.target.value)}
                      placeholder="e.g., TOTAL, Total Amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantityLabel">Quantity Label</Label>
                    <Input
                      id="quantityLabel"
                      value={settings.labels.quantityLabel}
                      onChange={(e) => updateLabels('quantityLabel', e.target.value)}
                      placeholder="e.g., Qty, Quantity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceLabel">Price Label</Label>
                    <Input
                      id="priceLabel"
                      value={settings.labels.priceLabel}
                      onChange={(e) => updateLabels('priceLabel', e.target.value)}
                      placeholder="e.g., Price, Unit Price"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Print Settings */}
            <TabsContent value="print" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Printer className="w-5 h-5 mr-2" />
                    Print Settings
                  </CardTitle>
                  <CardDescription>
                    Configure printing options for receipts and invoices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="paperSize">Paper Size</Label>
                    <Select
                      value={settings.printSettings.paperSize}
                      onValueChange={(value) => updatePrintSettings('paperSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80mm">80mm Thermal Paper</SelectItem>
                        <SelectItem value="58mm">58mm Thermal Paper</SelectItem>
                        <SelectItem value="A4">A4 Paper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select
                      value={settings.printSettings.fontSize}
                      onValueChange={(value) => updatePrintSettings('fontSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="charactersPerLine">Characters per Line</Label>
                    <Input
                      id="charactersPerLine"
                      type="number"
                      value={settings.printSettings.charactersPerLine}
                      onChange={(e) => updatePrintSettings('charactersPerLine', parseInt(e.target.value))}
                      min="32"
                      max="64"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Standard: 48 for 80mm, 32 for 58mm
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoPrint">Auto Print Receipts</Label>
                      <Switch
                        id="autoPrint"
                        checked={settings.printSettings.autoPrint}
                        onCheckedChange={(checked) => updatePrintSettings('autoPrint', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="printLogo">Print Logo</Label>
                      <Switch
                        id="printLogo"
                        checked={settings.printSettings.printLogo}
                        onCheckedChange={(checked) => updatePrintSettings('printLogo', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="printBarcode">Print Barcode</Label>
                      <Switch
                        id="printBarcode"
                        checked={settings.printSettings.printBarcode}
                        onCheckedChange={(checked) => updatePrintSettings('printBarcode', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Display Settings */}
            <TabsContent value="display" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Display Options
                  </CardTitle>
                  <CardDescription>
                    Control what information is shown on receipts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showTaxBreakdown">Show Tax Breakdown</Label>
                      <Switch
                        id="showTaxBreakdown"
                        checked={settings.displaySettings.showTaxBreakdown}
                        onCheckedChange={(checked) => updateDisplaySettings('showTaxBreakdown', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showDiscountBreakdown">Show Discount Breakdown</Label>
                      <Switch
                        id="showDiscountBreakdown"
                        checked={settings.displaySettings.showDiscountBreakdown}
                        onCheckedChange={(checked) => updateDisplaySettings('showDiscountBreakdown', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showLoyaltyPoints">Show Loyalty Points</Label>
                      <Switch
                        id="showLoyaltyPoints"
                        checked={settings.displaySettings.showLoyaltyPoints}
                        onCheckedChange={(checked) => updateDisplaySettings('showLoyaltyPoints', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showItemSku">Show Item SKU</Label>
                      <Switch
                        id="showItemSku"
                        checked={settings.displaySettings.showItemSku}
                        onCheckedChange={(checked) => updateDisplaySettings('showItemSku', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showItemBarcode">Show Item Barcode</Label>
                      <Switch
                        id="showItemBarcode"
                        checked={settings.displaySettings.showItemBarcode}
                        onCheckedChange={(checked) => updateDisplaySettings('showItemBarcode', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Live Preview
              </CardTitle>
              <CardDescription>
                Preview how your receipt will look on {settings.printSettings.paperSize}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 border rounded-lg overflow-hidden">
                <div 
                  className="mx-auto bg-white"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: getFontSize(),
                    lineHeight: 1.4,
                    width: settings.printSettings.paperSize === '80mm' ? '80mm' : 
                           settings.printSettings.paperSize === '58mm' ? '58mm' : '210mm',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'pre',
                    border: '1px solid #e5e7eb',
                    padding: '8px'
                  }}
                >
                  {thermalPreview}
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Preview Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>Paper Size: <Badge variant="outline">{settings.printSettings.paperSize}</Badge></div>
                  <div>Font Size: <Badge variant="outline">{settings.printSettings.fontSize}</Badge></div>
                  <div>Characters/Line: <Badge variant="outline">{settings.printSettings.charactersPerLine}</Badge></div>
                  <div>Auto Print: <Badge variant={settings.printSettings.autoPrint ? "default" : "secondary"}>
                    {settings.printSettings.autoPrint ? "Enabled" : "Disabled"}
                  </Badge></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}