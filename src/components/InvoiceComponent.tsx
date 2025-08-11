"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { FileText, Download, Mail, Printer, Building, Phone, Mail as MailIcon, Globe, MapPin, Calendar, Clock } from 'lucide-react'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'
import ReceiptComponent from './ReceiptComponent'

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

interface InvoiceData {
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

interface InvoiceComponentProps {
  invoice: InvoiceData
  onClose?: () => void
  showActions?: boolean
  onStatusChange?: (status: string) => void
}

export default function InvoiceComponent({ invoice, onClose, showActions = true, onStatusChange }: InvoiceComponentProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  // Company information (can be loaded from settings)
  const companyInfo = {
    name: "Your Business Name",
    address: "123 Business Street, City, State 12345",
    phone: "+880 1234-567890",
    email: "info@yourbusiness.com",
    website: "www.yourbusiness.com",
    taxId: "BIN: 123456789012"
  }

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice #${invoice.id.slice(-8)}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                margin: 0; 
                padding: 20px; 
                font-size: 12px;
                line-height: 1.6;
                color: #374151;
                background: #f9fafb;
              }
              
              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              
              .invoice-header {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white;
                padding: 2rem;
                text-align: center;
                position: relative;
              }
              
              .invoice-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.1;
              }
              
              .invoice-header h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                position: relative;
                z-index: 1;
              }
              
              .invoice-header .invoice-number {
                font-size: 1.2rem;
                opacity: 0.9;
                position: relative;
                z-index: 1;
              }
              
              .invoice-status {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                position: relative;
                z-index: 1;
              }
              
              .invoice-body {
                padding: 2rem;
              }
              
              .company-info {
                text-align: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #e5e7eb;
              }
              
              .company-info h2 {
                font-size: 1.5rem;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 0.5rem;
              }
              
              .company-details {
                color: #6b7280;
                font-size: 0.875rem;
              }
              
              .parties {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                margin-bottom: 2rem;
              }
              
              .party-info {
                background: #f9fafb;
                padding: 1rem;
                border-radius: 8px;
                border-left: 4px solid #059669;
              }
              
              .party-info h3 {
                font-size: 0.875rem;
                font-weight: 600;
                color: #374151;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              
              .party-details {
                font-size: 0.813rem;
                color: #6b7280;
              }
              
              .invoice-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
              }
              
              .detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              
              .detail-label {
                font-weight: 500;
                color: #374151;
                font-size: 0.813rem;
              }
              
              .detail-value {
                color: #6b7280;
                font-size: 0.813rem;
              }
              
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 2rem;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
              }
              
              .items-table th {
                background: #f3f4f6;
                padding: 0.75rem;
                text-align: left;
                font-weight: 600;
                color: #374151;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              
              .items-table td {
                padding: 0.75rem;
                border-bottom: 1px solid #f3f4f6;
                font-size: 0.813rem;
              }
              
              .items-table tr:last-child td {
                border-bottom: none;
              }
              
              .totals-section {
                max-width: 400px;
                margin-left: auto;
                margin-bottom: 2rem;
              }
              
              .total-row {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                font-size: 0.875rem;
              }
              
              .total-row.final {
                border-top: 2px solid #374151;
                padding-top: 1rem;
                font-weight: 700;
                font-size: 1.25rem;
                color: #1f2937;
              }
              
              .payment-method {
                display: inline-block;
                background: #d1fae5;
                color: #065f46;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
                margin-top: 0.5rem;
              }
              
              .terms-section {
                background: #f9fafb;
                padding: 1.5rem;
                border-radius: 8px;
                margin-bottom: 1rem;
              }
              
              .terms-section h3 {
                font-size: 0.875rem;
                font-weight: 600;
                color: #374151;
                margin-bottom: 0.5rem;
              }
              
              .terms-section p {
                font-size: 0.75rem;
                color: #6b7280;
                line-height: 1.5;
              }
              
              .footer {
                text-align: center;
                padding: 1rem;
                background: #f9fafb;
                color: #6b7280;
                font-size: 0.75rem;
              }
              
              .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 4rem;
                color: rgba(0, 0, 0, 0.05);
                font-weight: 700;
                z-index: 0;
                pointer-events: none;
              }
              
              @media print {
                body { 
                  background: white; 
                  padding: 0;
                }
                
                .invoice-container {
                  box-shadow: none;
                  border-radius: 0;
                }
                
                .watermark {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
        printWindow.close()
        
        toast({
          title: "Invoice sent to printer",
          description: "Invoice has been sent to your printer",
        })
      }
    }
  }

  const handleDownload = () => {
    const invoiceElement = document.getElementById('invoice-content')
    if (invoiceElement) {
      const invoiceHTML = invoiceElement.innerHTML
      
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice #${invoice.id.slice(-8)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              margin: 0; 
              padding: 20px; 
              font-size: 12px;
              line-height: 1.6;
              color: #374151;
              background: #f9fafb;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            
            .invoice-header {
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
              color: white;
              padding: 2rem;
              text-align: center;
            }
            
            .invoice-header h1 {
              font-size: 2.5rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
            }
          </style>
        </head>
        <body>
          ${invoiceHTML}
        </body>
        </html>
      `], { type: 'text/html' })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.id.slice(-8)}.html`
      a.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: "Invoice downloaded",
        description: "Invoice has been downloaded as HTML file",
      })
    }
  }

  const handleEmail = () => {
    if (!invoice.customerEmail) {
      toast({
        title: "No email address",
        description: "Customer email is required to send invoice",
        variant: "destructive"
      })
      return
    }

    const invoiceElement = document.getElementById('invoice-content')
    if (invoiceElement) {
      const invoiceHTML = invoiceElement.innerHTML
      
      const subject = `Invoice #${invoice.id.slice(-8)} from ${companyInfo.name}`
      const body = `
        Dear ${invoice.customerName || 'Valued Customer'},
        
        Please find your invoice attached below.
        
        Invoice ID: ${invoice.id.slice(-8)}
        Date: ${new Date(invoice.createdAt).toLocaleDateString()}
        Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
        Total: ${formatPrice(invoice.totalAmount + invoice.taxAmount - invoice.discount)}
        
        Payment terms: Due within 30 days
        
        Best regards,
        ${companyInfo.name}
        ${companyInfo.phone}
        ${companyInfo.email}
      `

      // Create mailto link
      const mailtoLink = `mailto:${invoice.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      // Open email client
      window.open(mailtoLink, '_blank')
      
      toast({
        title: "Email client opened",
        description: "Please send the email from your email client",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const subtotal = invoice.totalAmount
  const tax = invoice.taxAmount
  const discount = invoice.discount
  const total = subtotal + tax - discount

  return (
    <div className="space-y-4">
      {/* Invoice Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Invoice #{invoice.id.slice(-8)}
            <Badge className={`ml-auto ${getStatusColor(invoice.status || 'draft')}`}>
              {invoice.status || 'draft'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div id="invoice-content" className="invoice-container relative">
              {/* Watermark */}
              <div className="watermark">PAID</div>
              
              {/* Header */}
              <div className="invoice-header">
                <h1>{companyInfo.name}</h1>
                <div className="invoice-number">
                  INVOICE #{invoice.id.slice(-8)}
                </div>
                <div className="invoice-status">
                  {invoice.status || 'draft'}
                </div>
              </div>

              <div className="invoice-body">
                {/* Company Information */}
                <div className="company-info">
                  <h2>{companyInfo.name}</h2>
                  <div className="company-details">
                    <div className="flex items-center justify-center mb-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {companyInfo.address}
                    </div>
                    <div className="flex items-center justify-center mb-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {companyInfo.phone}
                    </div>
                    <div className="flex items-center justify-center mb-1">
                      <MailIcon className="h-3 w-3 mr-1" />
                      {companyInfo.email}
                    </div>
                    <div className="flex items-center justify-center">
                      <Globe className="h-3 w-3 mr-1" />
                      {companyInfo.website}
                    </div>
                  </div>
                </div>

                {/* Bill To and Company Info */}
                <div className="parties">
                  <div className="party-info">
                    <h3>Bill To:</h3>
                    <div className="party-details">
                      <div className="font-medium">{invoice.customerName || 'Cash Customer'}</div>
                      {invoice.customerAddress && (
                        <div>{invoice.customerAddress}</div>
                      )}
                      {invoice.customerPhone && (
                        <div>{invoice.customerPhone}</div>
                      )}
                      {invoice.customerEmail && (
                        <div>{invoice.customerEmail}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="party-info">
                    <h3>From:</h3>
                    <div className="party-details">
                      <div className="font-medium">{companyInfo.name}</div>
                      <div>{companyInfo.address}</div>
                      <div>{companyInfo.phone}</div>
                      <div>{companyInfo.email}</div>
                      <div>{companyInfo.taxId}</div>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="invoice-details">
                  <div className="detail-item">
                    <span className="detail-label">Invoice Date:</span>
                    <span className="detail-value">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Due Date:</span>
                    <span className="detail-value">
                      {invoice.dueDate 
                        ? new Date(invoice.dueDate).toLocaleDateString() 
                        : new Date(new Date(invoice.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created By:</span>
                    <span className="detail-value">{invoice.user.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Method:</span>
                    <span className="detail-value">
                      <Badge variant="secondary" className="text-xs">
                        {invoice.paymentMethod.toUpperCase()}
                      </Badge>
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.saleItems.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="font-medium">{item.product.name}</div>
                        </td>
                        <td>{item.product.sku || 'N/A'}</td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.unitPrice)}</td>
                        <td>{formatPrice(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="totals-section">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {tax > 0 && (
                    <div className="total-row">
                      <span>Tax ({((tax / subtotal) * 100).toFixed(1)}%):</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="total-row">
                      <span>Discount:</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="total-row final">
                    <span>TOTAL:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="payment-method">
                    {invoice.paymentMethod.toUpperCase()}
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="terms-section">
                  <h3>Payment Terms</h3>
                  <p>
                    Payment is due within 30 days of invoice date. Late payments are subject to a 1.5% monthly finance charge. 
                    Please reference invoice number when making payment. For any questions regarding this invoice, 
                    please contact our accounting department at {companyInfo.email}.
                  </p>
                </div>

                {/* Thank You Note */}
                <div className="terms-section">
                  <h3>Thank You</h3>
                  <p>
                    We appreciate your business and look forward to serving you again. 
                    For immediate assistance, please call us at {companyInfo.phone}.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="footer">
                <div>{companyInfo.name} | {companyInfo.phone} | {companyInfo.email}</div>
                <div className="mt-1">
                  Invoice ID: {invoice.id.slice(-8)} | 
                  Generated on {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleEmail} variant="outline" className="flex-1">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          
          {/* Status Change */}
          {onStatusChange && (
            <Select onValueChange={onStatusChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {onClose && (
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          )}
        </div>
      )}
    </div>
  )
}