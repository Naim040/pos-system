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
  Save
} from 'lucide-react'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'

interface InvoiceItem {
  id: string
  productId?: string
  productVariationId?: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discount?: number
  taxRate: number
  taxAmount: number
  sku?: string
  barcode?: string
}

interface InvoiceCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  taxId?: string
  loyaltyPoints?: number
  loyaltyTier?: string
}

interface InvoicePayment {
  id: string
  method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'credit'
  amount: number
  date: string
  reference?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
}

interface InvoiceTax {
  id: string
  name: string
  rate: number
  amount: number
  description?: string
}

interface InvoiceDiscount {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  amount: number
  description?: string
}

interface InvoiceWarranty {
  id: string
  productId: string
  productName: string
  warrantyType: 'manufacturer' | 'extended' | 'store'
  duration: string
  coverage: string
  terms?: string
  validUntil: string
}

interface InvoiceTemplate {
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

interface InvoiceComponentProps {
  invoice?: {
    id: string
    invoiceNumber: string
    date: string
    dueDate?: string
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    customer: InvoiceCustomer
    items: InvoiceItem[]
    payments: InvoicePayment[]
    taxes: InvoiceTax[]
    discounts: InvoiceDiscount[]
    warranties: InvoiceWarranty[]
    subtotal: number
    totalDiscount: number
    totalTax: number
    totalAmount: number
    paidAmount: number
    balanceDue: number
    notes?: string
    terms?: string
    barcode?: string
    loyaltyPointsEarned?: number
    loyaltyPointsRedeemed?: number
  }
  template?: InvoiceTemplate
  isEditable?: boolean
  onSave?: (invoice: any) => void
  onPrint?: () => void
  onDownload?: (format: 'pdf' | 'html') => void
  onEmail?: () => void
}

export default function InvoiceTemplate({
  invoice,
  template,
  isEditable = false,
  onSave,
  onPrint,
  onDownload,
  onEmail
}: InvoiceComponentProps) {
  const [currentTemplate, setCurrentTemplate] = useState<InvoiceTemplate>(template || {
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

  const [isEditing, setIsEditing] = useState(false)
  const [showTemplateSettings, setShowTemplateSettings] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
      return
    }
    window.print()
  }

  const handleDownload = (format: 'pdf' | 'html') => {
    if (onDownload) {
      onDownload(format)
      return
    }
    
    if (format === 'html') {
      const htmlContent = invoiceRef.current?.innerHTML
      if (htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice?.invoiceNumber || 'draft'}.html`
        a.click()
        URL.revokeObjectURL(url)
      }
    }
  }

  const handleEmail = () => {
    if (onEmail) {
      onEmail()
      return
    }
    // Placeholder for email functionality
    alert('Email functionality would be implemented here')
  }

  const renderHeader = () => {
    if (!currentTemplate.header.showLogo && !currentTemplate.header.showBusinessInfo && 
        !currentTemplate.header.showInvoiceNumber && !currentTemplate.header.showDate) {
      return null
    }

    return (
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {currentTemplate.header.showLogo && (
              <div className="mb-2">
                <div className="w-32 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-sm text-gray-600">Logo</span>
                </div>
              </div>
            )}
            
            {currentTemplate.header.showBusinessInfo && (
              <div>
                <h2 className="text-xl font-bold" style={{ color: currentTemplate.styling.primaryColor }}>
                  Your Business Name
                </h2>
                <p className="text-sm text-gray-600">123 Business Street, City, State 12345</p>
                <p className="text-sm text-gray-600">Phone: (555) 123-4567 | Email: info@business.com</p>
                <p className="text-sm text-gray-600">Tax ID: TAX123456789</p>
              </div>
            )}
          </div>

          <div className="text-right">
            {currentTemplate.header.showInvoiceNumber && invoice && (
              <div className="mb-2">
                <Label className="text-sm font-medium">Invoice Number</Label>
                <p className="text-lg font-bold">{invoice.invoiceNumber}</p>
              </div>
            )}
            
            {currentTemplate.header.showDate && invoice && (
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm">{new Date(invoice.date).toLocaleDateString()}</p>
                {invoice.dueDate && (
                  <div className="mt-1">
                    <Label className="text-sm font-medium">Due Date</Label>
                    <p className="text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {currentTemplate.header.customText && (
          <div className="text-center py-2">
            <p className="text-sm italic">{currentTemplate.header.customText}</p>
          </div>
        )}

        <Separator />
      </div>
    )
  }

  const renderCustomerInfo = () => {
    if (!currentTemplate.sections.showCustomerInfo || !invoice?.customer) {
      return null
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Bill To</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">{invoice.customer.name}</p>
            {invoice.customer.email && (
              <p className="text-sm text-gray-600">{invoice.customer.email}</p>
            )}
            {invoice.customer.phone && (
              <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
            )}
            {invoice.customer.taxId && (
              <p className="text-sm text-gray-600">Tax ID: {invoice.customer.taxId}</p>
            )}
          </div>
          <div>
            {invoice.customer.address && (
              <p className="text-sm">{invoice.customer.address}</p>
            )}
            {(invoice.customer.city || invoice.customer.state) && (
              <p className="text-sm">
                {invoice.customer.city}, {invoice.customer.state} {invoice.customer.postalCode}
              </p>
            )}
            {invoice.customer.country && (
              <p className="text-sm">{invoice.customer.country}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderItemsTable = () => {
    if (!invoice?.items) {
      return null
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-medium">Item</th>
                <th className="text-right py-2 px-3 text-sm font-medium">Qty</th>
                <th className="text-right py-2 px-3 text-sm font-medium">Unit Price</th>
                <th className="text-right py-2 px-3 text-sm font-medium">Discount</th>
                <th className="text-right py-2 px-3 text-sm font-medium">Tax</th>
                <th className="text-right py-2 px-3 text-sm font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 px-3">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-600">{item.description}</p>
                      )}
                      {item.sku && (
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-sm">{item.quantity}</td>
                  <td className="py-3 px-3 text-right text-sm">{formatPrice(item.unitPrice)}</td>
                  <td className="py-3 px-3 text-right text-sm">
                    {item.discount ? formatPrice(item.discount) : '-'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-sm">
                    {formatPrice(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderTaxBreakdown = () => {
    if (!currentTemplate.sections.showTaxBreakdown || !invoice?.taxes || invoice.taxes.length === 0) {
      return null
    }

    return (
      <div className="mb-4">
        <h4 className="font-medium mb-2">Tax Breakdown</h4>
        <div className="space-y-1">
          {invoice.taxes.map((tax) => (
            <div key={tax.id} className="flex justify-between text-sm">
              <span>{tax.name} ({tax.rate}%)</span>
              <span>{formatPrice(tax.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDiscountBreakdown = () => {
    if (!currentTemplate.sections.showDiscountBreakdown || !invoice?.discounts || invoice.discounts.length === 0) {
      return null
    }

    return (
      <div className="mb-4">
        <h4 className="font-medium mb-2">Discount Breakdown</h4>
        <div className="space-y-1">
          {invoice.discounts.map((discount) => (
            <div key={discount.id} className="flex justify-between text-sm">
              <span>{discount.name} ({discount.type === 'percentage' ? `${discount.value}%` : formatPrice(discount.value)})</span>
              <span className="text-green-600">-{formatPrice(discount.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderLoyaltyInfo = () => {
    if (!currentTemplate.sections.showLoyaltyInfo || !invoice?.customer) {
      return null
    }

    const hasLoyaltyData = invoice.loyaltyPointsEarned || invoice.loyaltyPointsRedeemed || 
                         invoice.customer.loyaltyPoints || invoice.customer.loyaltyTier

    if (!hasLoyaltyData) {
      return null
    }

    return (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center">
          <Gift className="w-4 h-4 mr-2" />
          Loyalty Program
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {invoice.customer.loyaltyTier && (
            <div>
              <span className="text-gray-600">Tier:</span>
              <span className="ml-2 font-medium">{invoice.customer.loyaltyTier}</span>
            </div>
          )}
          {invoice.customer.loyaltyPoints !== undefined && (
            <div>
              <span className="text-gray-600">Balance:</span>
              <span className="ml-2 font-medium">{invoice.customer.loyaltyPoints} pts</span>
            </div>
          )}
          {invoice.loyaltyPointsEarned && (
            <div>
              <span className="text-gray-600">Earned:</span>
              <span className="ml-2 font-medium text-green-600">+{invoice.loyaltyPointsEarned} pts</span>
            </div>
          )}
          {invoice.loyaltyPointsRedeemed && (
            <div>
              <span className="text-gray-600">Redeemed:</span>
              <span className="ml-2 font-medium text-orange-600">-{invoice.loyaltyPointsRedeemed} pts</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderWarrantyInfo = () => {
    if (!currentTemplate.sections.showWarrantyInfo || !invoice?.warranties || invoice.warranties.length === 0) {
      return null
    }

    return (
      <div className="mb-4">
        <h4 className="font-medium mb-2 flex items-center">
          <Shield className="w-4 h-4 mr-2" />
          Warranty Information
        </h4>
        <div className="space-y-2">
          {invoice.warranties.map((warranty) => (
            <div key={warranty.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-sm">{warranty.productName}</p>
                  <Badge variant="outline" className="text-xs">
                    {warranty.warrantyType}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Valid Until</p>
                  <p className="text-sm font-medium">{new Date(warranty.validUntil).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-1">{warranty.duration}</span>
                </div>
                <div>
                  <span className="text-gray-600">Coverage:</span>
                  <span className="ml-1">{warranty.coverage}</span>
                </div>
              </div>
              {warranty.terms && (
                <p className="text-xs text-gray-600 mt-2">{warranty.terms}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderBarcode = () => {
    if (!currentTemplate.sections.showBarcode || !invoice?.barcode) {
      return null
    }

    return (
      <div className="mb-4 text-center">
        <div className="inline-block p-4 border-2 border-dashed border-gray-300 rounded">
          <Barcode className="w-32 h-12 mx-auto mb-2" />
          <p className="text-xs font-mono">{invoice.barcode}</p>
        </div>
      </div>
    )
  }

  const renderPaymentInfo = () => {
    if (!currentTemplate.sections.showPaymentInfo || !invoice?.payments || invoice.payments.length === 0) {
      return null
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
        <div className="space-y-2">
          {invoice.payments.map((payment) => (
            <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-sm capitalize">{payment.method.replace('_', ' ')}</p>
                <p className="text-xs text-gray-600">
                  {new Date(payment.date).toLocaleDateString()}
                  {payment.reference && ` • Ref: ${payment.reference}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatPrice(payment.amount)}</p>
                <Badge 
                  variant={payment.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSummary = () => {
    if (!invoice) {
      return null
    }

    return (
      <div className="mb-6">
        <div className="max-w-xs ml-auto">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPrice(invoice.subtotal)}</span>
            </div>
            {invoice.totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Total Discount:</span>
                <span>-{formatPrice(invoice.totalDiscount)}</span>
              </div>
            )}
            {invoice.totalTax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Total Tax:</span>
                <span>{formatPrice(invoice.totalTax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount:</span>
              <span>{formatPrice(invoice.totalAmount)}</span>
            </div>
            {invoice.paidAmount > 0 && (
              <>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid:</span>
                  <span>{formatPrice(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Balance Due:</span>
                  <span className={invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatPrice(invoice.balanceDue)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderTerms = () => {
    if (!currentTemplate.sections.showTerms || !invoice?.terms) {
      return null
    }

    return (
      <div className="mb-6">
        <h4 className="font-medium mb-2">Terms & Conditions</h4>
        <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.terms}</p>
      </div>
    )
  }

  const renderFooter = () => {
    const footerElements = []

    if (currentTemplate.footer.showThankYou) {
      footerElements.push(
        <div key="thank-you" className="text-center mb-4">
          <p className="font-medium">Thank you for your business!</p>
        </div>
      )
    }

    if (currentTemplate.footer.showContactInfo) {
      footerElements.push(
        <div key="contact-info" className="text-center mb-4">
          <p className="text-sm text-gray-600">
            Contact: (555) 123-4567 | info@business.com | www.business.com
          </p>
        </div>
      )
    }

    if (currentTemplate.footer.showReturnPolicy) {
      footerElements.push(
        <div key="return-policy" className="mb-4">
          <h4 className="font-medium mb-2 flex items-center">
            <RotateCcw className="w-4 h-4 mr-2" />
            Return Policy
          </h4>
          <p className="text-sm text-gray-600">
            Items can be returned within 30 days of purchase with original receipt. 
            Items must be in original condition. Some restrictions apply.
          </p>
        </div>
      )
    }

    if (currentTemplate.footer.customText) {
      footerElements.push(
        <div key="custom-text" className="text-center">
          <p className="text-sm italic">{currentTemplate.footer.customText}</p>
        </div>
      )
    }

    if (footerElements.length === 0) {
      return null
    }

    return (
      <div className="mt-8 pt-6 border-t">
        {footerElements}
      </div>
    )
  }

  const renderInvoiceContent = () => {
    return (
      <div 
        ref={invoiceRef}
        className="bg-white p-8"
        style={{
          fontFamily: currentTemplate.styling.fontFamily,
          fontSize: `${currentTemplate.styling.fontSize}px`,
          color: currentTemplate.styling.secondaryColor
        }}
      >
        {renderHeader()}
        {renderCustomerInfo()}
        {renderItemsTable()}
        {renderSummary()}
        {renderTaxBreakdown()}
        {renderDiscountBreakdown()}
        {renderPaymentInfo()}
        {renderLoyaltyInfo()}
        {renderWarrantyInfo()}
        {renderBarcode()}
        {renderTerms()}
        {renderFooter()}
      </div>
    )
  }

  const renderThermalVersion = () => {
    if (!invoice) {
      return null
    }

    return (
      <div 
        className="bg-white p-4 text-xs"
        style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          width: '80mm',
          maxWidth: '80mm'
        }}
      >
        {/* Header */}
        <div className="text-center mb-3">
          <div className="font-bold text-sm">YOUR BUSINESS</div>
          <div className="text-xs">123 Business St</div>
          <div className="text-xs">Tel: (555) 123-4567</div>
        </div>

        <div className="border-t border-b py-2 my-2 text-center">
          <div className="font-bold">INVOICE</div>
          <div>#{invoice.invoiceNumber}</div>
          <div>{new Date(invoice.date).toLocaleDateString()}</div>
        </div>

        {/* Customer */}
        {currentTemplate.sections.showCustomerInfo && (
          <div className="mb-2">
            <div className="font-bold">Customer:</div>
            <div>{invoice.customer.name}</div>
            {invoice.customer.phone && <div>{invoice.customer.phone}</div>}
          </div>
        )}

        {/* Items */}
        <div className="mb-2">
          {invoice.items.map((item) => (
            <div key={item.id} className="mb-1">
              <div className="flex justify-between">
                <span className="font-medium">{item.name}</span>
                <span>{formatPrice(item.totalPrice)}</span>
              </div>
              <div className="text-gray-600">
                {item.quantity} x {formatPrice(item.unitPrice)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t pt-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatPrice(invoice.subtotal)}</span>
          </div>
          {invoice.totalDiscount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatPrice(invoice.totalDiscount)}</span>
            </div>
          )}
          {invoice.totalTax > 0 && (
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{formatPrice(invoice.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-1">
            <span>TOTAL:</span>
            <span>{formatPrice(invoice.totalAmount)}</span>
          </div>
        </div>

        {/* Payment */}
        {invoice.paidAmount > 0 && (
          <div className="mt-2">
            <div className="flex justify-between">
              <span>Paid:</span>
              <span>{formatPrice(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Balance:</span>
              <span>{formatPrice(invoice.balanceDue)}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-3 pt-2 border-t">
          <div>Thank you!</div>
          {currentTemplate.footer.showContactInfo && (
            <div className="text-xs">(555) 123-4567</div>
          )}
        </div>

        {/* Barcode */}
        {currentTemplate.sections.showBarcode && invoice.barcode && (
          <div className="text-center mt-2">
            <div className="font-mono text-xs">{invoice.barcode}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={() => handleDownload('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleDownload('html')}>
            <FileText className="w-4 h-4 mr-2" />
            HTML
          </Button>
          <Button variant="outline" onClick={handleEmail}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateSettings(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Template
          </Button>
          {isEditable && onSave && (
            <Button onClick={() => onSave(invoice)}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Template Tabs */}
      <Tabs defaultValue={currentTemplate.type} className="w-full">
        <TabsList>
          <TabsTrigger value="a4">A4 Invoice</TabsTrigger>
          <TabsTrigger value="thermal">Thermal Receipt</TabsTrigger>
        </TabsList>
        
        <TabsContent value="a4" className="mt-4">
          <div className="border rounded-lg shadow-sm overflow-hidden">
            {renderInvoiceContent()}
          </div>
        </TabsContent>
        
        <TabsContent value="thermal" className="mt-4">
          <div className="flex justify-center">
            <div className="border rounded-lg shadow-sm overflow-hidden bg-gray-100 p-4">
              {renderThermalVersion()}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Settings Dialog */}
      <Dialog open={showTemplateSettings} onOpenChange={setShowTemplateSettings}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Settings</DialogTitle>
            <DialogDescription>
              Customize your invoice template appearance and content
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header Settings */}
            <div>
              <h4 className="font-medium mb-3">Header Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showLogo"
                    checked={currentTemplate.header.showLogo}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        header: { ...prev.header, showLogo: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showLogo">Show Logo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showBusinessInfo"
                    checked={currentTemplate.header.showBusinessInfo}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        header: { ...prev.header, showBusinessInfo: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showBusinessInfo">Show Business Info</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showInvoiceNumber"
                    checked={currentTemplate.header.showInvoiceNumber}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        header: { ...prev.header, showInvoiceNumber: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showInvoiceNumber">Show Invoice Number</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showDate"
                    checked={currentTemplate.header.showDate}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        header: { ...prev.header, showDate: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showDate">Show Date</Label>
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="customHeaderText">Custom Header Text</Label>
                <Input
                  id="customHeaderText"
                  value={currentTemplate.header.customText || ''}
                  onChange={(e) =>
                    setCurrentTemplate(prev => ({
                      ...prev,
                      header: { ...prev.header, customText: e.target.value }
                    }))
                  }
                  placeholder="Enter custom header text..."
                />
              </div>
            </div>

            {/* Section Settings */}
            <div>
              <h4 className="font-medium mb-3">Section Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showCustomerInfo"
                    checked={currentTemplate.sections.showCustomerInfo}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        sections: { ...prev.sections, showCustomerInfo: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showCustomerInfo">Customer Info</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showPaymentInfo"
                    checked={currentTemplate.sections.showPaymentInfo}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        sections: { ...prev.sections, showPaymentInfo: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showPaymentInfo">Payment Info</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showTaxBreakdown"
                    checked={currentTemplate.sections.showTaxBreakdown}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        sections: { ...prev.sections, showTaxBreakdown: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showTaxBreakdown">Tax Breakdown</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showDiscountBreakdown"
                    checked={currentTemplate.sections.showDiscountBreakdown}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        sections: { ...prev.sections, showDiscountBreakdown: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showDiscountBreakdown">Discount Breakdown</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showLoyaltyInfo"
                    checked={currentTemplate.sections.showLoyaltyInfo}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        sections: { ...prev.sections, showLoyaltyInfo: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showLoyaltyInfo">Loyalty Info</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showWarrantyInfo"
                    checked={currentTemplate.sections.showWarrantyInfo}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        sections: { ...prev.sections, showWarrantyInfo: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showWarrantyInfo">Warranty Info</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showBarcode"
                    checked={currentTemplate.sections.showBarcode}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        sections: { ...prev.sections, showBarcode: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showBarcode">Barcode</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showTerms"
                    checked={currentTemplate.sections.showTerms}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        sections: { ...prev.sections, showTerms: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showTerms">Terms & Conditions</Label>
                </div>
              </div>
            </div>

            {/* Footer Settings */}
            <div>
              <h4 className="font-medium mb-3">Footer Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showThankYou"
                    checked={currentTemplate.footer.showThankYou}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        footer: { ...prev.footer, showThankYou: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showThankYou">Thank You Message</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showContactInfo"
                    checked={currentTemplate.footer.showContactInfo}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        footer: { ...prev.footer, showContactInfo: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showContactInfo">Contact Info</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showReturnPolicy"
                    checked={currentTemplate.footer.showReturnPolicy}
                    onCheckedChange={(checked) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        footer: { ...prev.footer, showReturnPolicy: checked }
                      }))
                    }
                  />
                  <Label htmlFor="showReturnPolicy">Return Policy</Label>
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="customFooterText">Custom Footer Text</Label>
                <Textarea
                  id="customFooterText"
                  value={currentTemplate.footer.customText || ''}
                  onChange={(e) =>
                    setCurrentTemplate(prev => ({
                      ...prev,
                      footer: { ...prev.footer, customText: e.target.value }
                    }))
                  }
                  placeholder="Enter custom footer text..."
                  rows={2}
                />
              </div>
            </div>

            {/* Styling Settings */}
            <div>
              <h4 className="font-medium mb-3">Styling Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={currentTemplate.styling.theme}
                    onValueChange={(value) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        styling: { ...prev.styling, theme: value as any }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fontSize">Font Size (px)</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={currentTemplate.styling.fontSize}
                    onChange={(e) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        styling: { ...prev.styling, fontSize: parseInt(e.target.value) || 12 }
                      }))
                    }
                    min={8}
                    max={20}
                  />
                </div>
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={currentTemplate.styling.primaryColor}
                    onChange={(e) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        styling: { ...prev.styling, primaryColor: e.target.value }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={currentTemplate.styling.secondaryColor}
                    onChange={(e) =>
                      setCurrentTemplate(prev => ({
                        ...prev,
                        styling: { ...prev.styling, secondaryColor: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowTemplateSettings(false)}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}