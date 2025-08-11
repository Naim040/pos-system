"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Printer, 
  Download, 
  Settings, 
  RotateCcw,
  Check,
  X
} from 'lucide-react'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'

interface ThermalPrinterSettings {
  paperWidth: number // 80mm
  fontSize: number
  lineHeight: number
  characterWidth: number // characters per line
  autoCut: boolean
  printLogo: boolean
  printBarcode: boolean
  printQR: boolean
  encoding: 'ESC/POS' | 'ZPL' | 'CPCL'
}

interface ThermalReceiptData {
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
    reference?: string
  }
  customer?: {
    name: string
    phone?: string
    email?: string
    loyaltyPoints?: number
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
  footer?: {
    thankYou?: string
    returnPolicy?: string
    contact?: string
    website?: string
  }
}

const DEFAULT_SETTINGS: ThermalPrinterSettings = {
  paperWidth: 80,
  fontSize: 12,
  lineHeight: 1.2,
  characterWidth: 48, // Standard for 80mm thermal printers
  autoCut: true,
  printLogo: false,
  printBarcode: true,
  printQR: true,
  encoding: 'ESC/POS'
}

export default function ThermalPrinter80mm({ 
  receiptData, 
  onPrintComplete,
  onError 
}: { 
  receiptData: ThermalReceiptData
  onPrintComplete?: () => void
  onError?: (error: string) => void 
}) {
  const [settings, setSettings] = useState<ThermalPrinterSettings>(DEFAULT_SETTINGS)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [printPreview, setPrintPreview] = useState(true)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Center text function for thermal printer
  const centerText = (text: string, width: number = settings.characterWidth): string => {
    const padding = Math.floor((width - text.length) / 2)
    return ' '.repeat(Math.max(0, padding)) + text
  }

  // Generate thermal receipt content
  const generateThermalContent = (): string => {
    const currencySymbol = getCurrencySymbol()
    const { characterWidth } = settings
    let content = ''

    // Header
    content += centerText(receiptData.businessInfo.name.toUpperCase(), characterWidth) + '\n'
    content += centerText(receiptData.businessInfo.address, characterWidth) + '\n'
    content += centerText('Tel: ' + receiptData.businessInfo.phone, characterWidth) + '\n'
    if (receiptData.businessInfo.taxId) {
      content += centerText('TAX ID: ' + receiptData.businessInfo.taxId, characterWidth) + '\n'
    }
    content += '\n'

    // Receipt info
    content += centerText('RECEIPT', characterWidth) + '\n'
    content += 'No: ' + receiptData.receiptInfo.receiptNumber + '\n'
    content += 'Date: ' + receiptData.receiptInfo.date + '\n'
    content += 'Time: ' + receiptData.receiptInfo.time + '\n'
    content += 'Cashier: ' + receiptData.receiptInfo.cashier + '\n'
    content += 'Payment: ' + receiptData.receiptInfo.paymentMethod.toUpperCase() + '\n'
    if (receiptData.receiptInfo.reference) {
      content += 'Ref: ' + receiptData.receiptInfo.reference + '\n'
    }
    content += '\n'

    // Customer info
    if (receiptData.customer) {
      content += 'Customer: ' + receiptData.customer.name + '\n'
      if (receiptData.customer.phone) {
        content += 'Phone: ' + receiptData.customer.phone + '\n'
      }
      if (receiptData.customer.loyaltyPoints) {
        content += 'Points: ' + receiptData.customer.loyaltyPoints + '\n'
      }
      content += '\n'
    }

    // Items header
    content += 'Item'.padEnd(20) + 'Qty'.padEnd(6) + 'Price'.padEnd(10) + 'Total\n'
    content += '-'.repeat(characterWidth) + '\n'

    // Items
    receiptData.items.forEach(item => {
      const itemName = item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name
      content += itemName.padEnd(20)
      content += item.quantity.toString().padEnd(6)
      content += currencySymbol + item.unitPrice.toFixed(2).padEnd(9)
      content += currencySymbol + item.totalPrice.toFixed(2) + '\n'
      
      if (item.sku) {
        content += '  SKU: ' + item.sku + '\n'
      }
      if (item.discount && item.discount > 0) {
        content += '  Discount: -' + currencySymbol + item.discount.toFixed(2) + '\n'
      }
    })

    content += '-'.repeat(characterWidth) + '\n'

    // Summary
    content += 'Subtotal:'.padEnd(30) + currencySymbol + receiptData.summary.subtotal.toFixed(2) + '\n'
    if (receiptData.summary.discount > 0) {
      content += 'Discount:'.padEnd(30) + '-' + currencySymbol + receiptData.summary.discount.toFixed(2) + '\n'
    }
    if (receiptData.summary.tax > 0) {
      content += 'Tax:'.padEnd(30) + currencySymbol + receiptData.summary.tax.toFixed(2) + '\n'
    }
    content += 'TOTAL:'.padEnd(30) + currencySymbol + receiptData.summary.total.toFixed(2) + '\n'
    content += 'Paid:'.padEnd(30) + currencySymbol + receiptData.summary.paid.toFixed(2) + '\n'
    
    if (receiptData.summary.change && receiptData.summary.change > 0) {
      content += 'Change:'.padEnd(30) + currencySymbol + receiptData.summary.change.toFixed(2) + '\n'
    }

    content += '\n'

    // Footer
    if (receiptData.footer) {
      if (receiptData.footer.thankYou) {
        content += centerText(receiptData.footer.thankYou, characterWidth) + '\n'
      }
      if (receiptData.footer.returnPolicy) {
        content += centerText(receiptData.footer.returnPolicy, characterWidth) + '\n'
      }
      content += '\n'
      if (receiptData.footer.contact) {
        content += centerText(receiptData.footer.contact, characterWidth) + '\n'
      }
      if (receiptData.footer.website) {
        content += centerText(receiptData.footer.website, characterWidth) + '\n'
      }
    }

    return content
  }

  // Generate ESC/POS commands
  const generateESCPOS = (): Uint8Array => {
    const content = generateThermalContent()
    const encoder = new TextEncoder()
    let commands = new Uint8Array()

    // Initialize printer
    const init = new Uint8Array([0x1B, 0x40]) // ESC @ - Initialize
    commands = new Uint8Array([...commands, ...init])

    // Set character size
    const normalSize = new Uint8Array([0x1B, 0x21, 0x00]) // ESC ! 0 - Normal size
    commands = new Uint8Array([...commands, ...normalSize])

    // Set alignment to center for header
    const centerAlign = new Uint8Array([0x1B, 0x61, 0x01]) // ESC a 1 - Center align
    commands = new Uint8Array([...commands, ...centerAlign])

    // Add content
    const contentBytes = encoder.encode(content)
    commands = new Uint8Array([...commands, ...contentBytes])

    // Feed and cut
    if (settings.autoCut) {
      const feed = new Uint8Array([0x1B, 0x64, 0x03]) // ESC d 3 - Feed 3 lines
      const cut = new Uint8Array([0x1D, 0x56, 0x00]) // GS V 0 - Full cut
      commands = new Uint8Array([...commands, ...feed, ...cut])
    }

    return commands
  }

  // Generate ZPL commands for Zebra printers
  const generateZPL = (): string => {
    const content = generateThermalContent()
    let zpl = '^XA\n' // Start label

    // Set printer defaults
    zpl += '^PW800\n' // Paper width 800 dots (80mm = 800 dots at 8dpmm)
    zpl += '^LL1200\n' // Label length 1200 dots
    zpl += '^FO20,20\n' // Field origin
    zpl += '^A0N,25,25\n' // Font A Normal, 25 point

    // Add content line by line
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      if (line.trim()) {
        zpl += `^FD${line}^FS\n`
        zpl += `^FO20,${20 + (index + 1) * 30}\n`
      }
    })

    zpl += '^XZ\n' // End label
    return zpl
  }

  // Print to thermal printer
  const printToThermal = async () => {
    setIsPrinting(true)
    try {
      let printData: string | Uint8Array

      switch (settings.encoding) {
        case 'ESC/POS':
          printData = generateESCPOS()
          break
        case 'ZPL':
          printData = generateZPL()
          break
        case 'CPCL':
          // CPCL implementation would go here
          printData = generateESCPOS() // Fallback to ESC/POS
          break
        default:
          printData = generateESCPOS()
      }

      // Create print content
      const printContent = typeof printData === 'string' ? printData : new Blob([printData])
      const printUrl = URL.createObjectURL(printContent)

      // Open print dialog
      const printWindow = window.open(printUrl, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
          printWindow.onafterprint = () => {
            printWindow.close()
            URL.revokeObjectURL(printUrl)
            setIsPrinting(false)
            onPrintComplete?.()
          }
        }
      } else {
        throw new Error('Failed to open print window')
      }

    } catch (error) {
      console.error('Print error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to print'
      onError?.(errorMessage)
      setIsPrinting(false)
    }
  }

  // Download as text file
  const downloadAsText = () => {
    const content = generateThermalContent()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${receiptData.receiptInfo.receiptNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      const content = generateThermalContent()
      await navigator.clipboard.writeText(content)
      alert('Receipt copied to clipboard!')
    } catch (error) {
      alert('Failed to copy to clipboard')
    }
  }

  const thermalContent = generateThermalContent()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">80mm Thermal Printer</h2>
          <p className="text-gray-600">Print receipts for Zebra thermal printers</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            onClick={downloadAsText}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={printToThermal}
            disabled={isPrinting}
          >
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? 'Printing...' : 'Print'}
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Printer Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={settings.fontSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  min="8"
                  max="16"
                />
              </div>
              <div>
                <Label htmlFor="characterWidth">Characters per Line</Label>
                <Input
                  id="characterWidth"
                  type="number"
                  value={settings.characterWidth}
                  onChange={(e) => setSettings(prev => ({ ...prev, characterWidth: parseInt(e.target.value) }))}
                  min="32"
                  max="64"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoCut">Auto Cut</Label>
                <Switch
                  id="autoCut"
                  checked={settings.autoCut}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoCut: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="printLogo">Print Logo</Label>
                <Switch
                  id="printLogo"
                  checked={settings.printLogo}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, printLogo: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="printBarcode">Print Barcode</Label>
                <Switch
                  id="printBarcode"
                  checked={settings.printBarcode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, printBarcode: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="printQR">Print QR Code</Label>
                <Switch
                  id="printQR"
                  checked={settings.printQR}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, printQR: checked }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="encoding">Printer Encoding</Label>
              <select
                id="encoding"
                value={settings.encoding}
                onChange={(e) => setSettings(prev => ({ ...prev, encoding: e.target.value as any }))}
                className="w-full p-2 border rounded"
              >
                <option value="ESC/POS">ESC/POS (Most thermal printers)</option>
                <option value="ZPL">ZPL (Zebra printers)</option>
                <option value="CPCL">CPCL (Some mobile printers)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Print Preview
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintPreview(!printPreview)}
              >
                {printPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {printPreview && (
          <CardContent>
            <div className="bg-white p-4 border rounded">
              <div 
                ref={receiptRef}
                style={{
                  fontFamily: 'monospace',
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: settings.lineHeight,
                  width: '80mm',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  whiteSpace: 'pre',
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  border: '1px solid #dee2e6'
                }}
              >
                {thermalContent}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}