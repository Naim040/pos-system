"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { Receipt, Download, Mail, Printer, Eye, FileText, Building, Phone, Mail as MailIcon, Globe, MapPin } from 'lucide-react'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'

interface ReceiptItem {
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

interface ReceiptData {
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
  user: {
    name: string
  }
  saleItems: ReceiptItem[]
}

interface ReceiptComponentProps {
  sale: ReceiptData
  onClose?: () => void
  showActions?: boolean
  viewType?: 'receipt' | 'invoice'
}

export default function ReceiptComponent({ sale, onClose, showActions = true, viewType = 'receipt' }: ReceiptComponentProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const subtotal = sale.totalAmount
  const tax = sale.taxAmount
  const discount = sale.discount
  const total = subtotal + tax - discount

  const isInvoice = viewType === 'invoice'

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
    const printContent = document.getElementById('receipt-content')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${isInvoice ? 'Invoice' : 'Receipt'} #${sale.id.slice(-8)}</title>
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
                background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
                color: white;
                padding: 2rem;
                text-align: center;
              }
              
              .invoice-header h1 {
                font-size: 2rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
              }
              
              .invoice-header .invoice-number {
                font-size: 1.1rem;
                opacity: 0.9;
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
                border-left: 4px solid #3b82f6;
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
                font-size: 1.125rem;
                color: #1f2937;
              }
              
              .payment-method {
                display: inline-block;
                background: #dbeafe;
                color: #1e40af;
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
              
              @media print {
                body { 
                  background: white; 
                  padding: 0;
                }
                
                .invoice-container {
                  box-shadow: none;
                  border-radius: 0;
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
          title: `${isInvoice ? 'Invoice' : 'Receipt'} sent to printer`,
          description: `${isInvoice ? 'Invoice' : 'Receipt'} has been sent to your printer`,
        })
      }
    }
  }

  const handleDownload = () => {
    const receiptElement = document.getElementById('receipt-content')
    if (receiptElement) {
      const receiptHTML = receiptElement.innerHTML
      
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${isInvoice ? 'Invoice' : 'Receipt'} #${sale.id.slice(-8)}</title>
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
              background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
              color: white;
              padding: 2rem;
              text-align: center;
            }
            
            .invoice-header h1 {
              font-size: 2rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
            }
            
            .invoice-header .invoice-number {
              font-size: 1.1rem;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          ${receiptHTML}
        </body>
        </html>
      `], { type: 'text/html' })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${isInvoice ? 'invoice' : 'receipt'}-${sale.id.slice(-8)}.html`
      a.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: `${isInvoice ? 'Invoice' : 'Receipt'} downloaded`,
        description: `${isInvoice ? 'Invoice' : 'Receipt'} has been downloaded as HTML file`,
      })
    }
  }

  const handleEmail = () => {
    if (!sale.customerEmail) {
      toast({
        title: "No email address",
        description: "Customer email is required to send ${isInvoice ? 'invoice' : 'receipt'}",
        variant: "destructive"
      })
      return
    }

    const receiptElement = document.getElementById('receipt-content')
    if (receiptElement) {
      const receiptHTML = receiptElement.innerHTML
      
      const subject = `${isInvoice ? 'Invoice' : 'Receipt'} #${sale.id.slice(-8)} from ${companyInfo.name}`
      const body = `
        Dear ${sale.customerName || 'Valued Customer'},
        
        Thank you for your business!
        
        Your ${isInvoice ? 'invoice' : 'receipt'} is attached below.
        
        ${isInvoice ? 'Invoice' : 'Receipt'} ID: ${sale.id.slice(-8)}
        Date: ${new Date(sale.createdAt).toLocaleDateString()}
        Total: ${formatPrice(total)}
        
        ${isInvoice ? 'Payment terms: Due within 30 days' : 'Thank you for your purchase!'}
        
        Best regards,
        ${companyInfo.name}
        ${companyInfo.phone}
        ${companyInfo.email}
      `

      // Create mailto link
      const mailtoLink = `mailto:${sale.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      // Open email client
      window.open(mailtoLink, '_blank')
      
      toast({
        title: "Email client opened",
        description: "Please send the email from your email client",
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Invoice/Receipt Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {isInvoice ? 'Invoice' : 'Receipt'} #{sale.id.slice(-8)}
            <Badge variant="outline" className="ml-auto">
              {isInvoice ? 'Invoice' : 'Receipt'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div id="receipt-content" className="invoice-container">
            {/* Header */}
            <div className="invoice-header">
              <h1>{companyInfo.name}</h1>
              <div className="invoice-number">
                {isInvoice ? 'INVOICE' : 'RECEIPT'} #{sale.id.slice(-8)}
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
                      <div className="font-medium">{sale.customerName || 'Cash Customer'}</div>
                      {sale.customerAddress && (
                        <div>{sale.customerAddress}</div>
                      )}
                      {sale.customerPhone && (
                        <div>{sale.customerPhone}</div>
                      )}
                      {sale.customerEmail && (
                        <div>{sale.customerEmail}</div>
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
                    <span className="detail-label">{isInvoice ? 'Invoice' : 'Receipt'} Date:</span>
                    <span className="detail-value">{new Date(sale.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Cashier:</span>
                    <span className="detail-value">{sale.user.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Method:</span>
                    <span className="detail-value">
                      <Badge variant="secondary" className="text-xs">
                        {sale.paymentMethod.toUpperCase()}
                      </Badge>
                    </span>
                  </div>
                  {isInvoice && (
                    <div className="detail-item">
                      <span className="detail-label">Due Date:</span>
                      <span className="detail-value">
                        {new Date(new Date(sale.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.saleItems.map((item, index) => (
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
                    {sale.paymentMethod.toUpperCase()}
                  </div>
                </div>

                {/* Terms and Conditions */}
                {isInvoice && (
                  <div className="terms-section">
                    <h3>Payment Terms</h3>
                    <p>
                      Payment is due within 30 days of invoice date. Late payments are subject to a 1.5% monthly finance charge. 
                      Please reference invoice number when making payment.
                    </p>
                  </div>
                )}

                {/* Thank You Note */}
                <div className="terms-section">
                  <h3>{isInvoice ? 'Thank You' : 'Thank You for Your Business!'}</h3>
                  <p>
                    {isInvoice 
                      ? 'We appreciate your business and look forward to serving you again.'
                      : 'Returns accepted within 30 days with original receipt.'
                    }
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="footer">
                <div>{companyInfo.name} | {companyInfo.phone} | {companyInfo.email}</div>
                <div className="mt-1">
                  {isInvoice ? 'Invoice' : 'Receipt'} ID: {sale.id.slice(-8)} | 
                  Generated on {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
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