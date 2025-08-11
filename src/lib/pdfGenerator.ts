import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatPrice, getCurrencySymbol } from './currency'

export interface PDFGenerationOptions {
  format?: 'A4' | 'letter' | 'thermal'
  orientation?: 'portrait' | 'landscape'
  quality?: number
  scale?: number
  filename?: string
  autoPrint?: boolean
  watermark?: string
  password?: string
}

export interface InvoiceData {
  id: string
  invoiceNumber: string
  date: string
  dueDate?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  customer: {
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
  items: Array<{
    id: string
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
  }>
  payments: Array<{
    id: string
    method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'credit'
    amount: number
    date: string
    reference?: string
    status: 'pending' | 'completed' | 'failed' | 'refunded'
  }>
  taxes: Array<{
    id: string
    name: string
    rate: number
    amount: number
    description?: string
  }>
  discounts: Array<{
    id: string
    name: string
    type: 'percentage' | 'fixed'
    value: number
    amount: number
    description?: string
  }>
  warranties: Array<{
    id: string
    productId: string
    productName: string
    warrantyType: 'manufacturer' | 'extended' | 'store'
    duration: string
    coverage: string
    terms?: string
    validUntil: string
  }>
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

export class PDFGenerator {
  static async generateFromHTML(
    element: HTMLElement,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    const {
      format = 'A4',
      orientation = 'portrait',
      quality = 1,
      scale = 2,
      autoPrint = false,
      watermark,
      password
    } = options

    try {
      // Generate canvas from HTML
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: format.toLowerCase()
      })

      // Add canvas to PDF
      const imgData = canvas.toDataURL('image/png', quality)
      const imgWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      // Add watermark if provided
      if (watermark) {
        this.addWatermark(pdf, watermark)
      }

      // Add password protection if provided
      if (password) {
        pdf.encrypt(password)
      }

      // Auto print if requested
      if (autoPrint) {
        pdf.autoPrint()
      }

      return new Blob([pdf.output('blob')], { type: 'application/pdf' })
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error('Failed to generate PDF')
    }
  }

  static async generateInvoicePDF(
    invoiceData: InvoiceData,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    const {
      format = 'A4',
      orientation = 'portrait',
      filename = `invoice-${invoiceData.invoiceNumber}.pdf`,
      ...restOptions
    } = options

    try {
      // Create a temporary HTML element
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = this.generateInvoiceHTML(invoiceData)
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      tempDiv.style.width = format === 'thermal' ? '80mm' : '210mm'
      document.body.appendChild(tempDiv)

      try {
        const pdf = await this.generateFromHTML(tempDiv, {
          format,
          orientation,
          ...restOptions
        })

        return pdf
      } finally {
        document.body.removeChild(tempDiv)
      }
    } catch (error) {
      console.error('Invoice PDF generation error:', error)
      throw new Error('Failed to generate invoice PDF')
    }
  }

  private static generateInvoiceHTML(invoiceData: InvoiceData): string {
    const currencySymbol = getCurrencySymbol()

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: white; color: #333;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h1 style="margin: 0; color: #2563eb; font-size: 24px;">Your Business Name</h1>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">123 Business Street, City, State 12345</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">Phone: (555) 123-4567 | Email: info@business.com</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 20px;">INVOICE</h2>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Number:</strong> ${invoiceData.invoiceNumber}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(invoiceData.date).toLocaleDateString()}</p>
            ${invoiceData.dueDate ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>` : ''}
          </div>
        </div>

        <!-- Customer Info -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Bill To</h3>
          <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">${invoiceData.customer.name}</p>
          ${invoiceData.customer.email ? `<p style="margin: 5px 0; font-size: 12px;">${invoiceData.customer.email}</p>` : ''}
          ${invoiceData.customer.phone ? `<p style="margin: 5px 0; font-size: 12px;">${invoiceData.customer.phone}</p>` : ''}
          ${invoiceData.customer.address ? `<p style="margin: 5px 0; font-size: 12px;">${invoiceData.customer.address}</p>` : ''}
          ${(invoiceData.customer.city || invoiceData.customer.state) ? `<p style="margin: 5px 0; font-size: 12px;">${invoiceData.customer.city || ''}, ${invoiceData.customer.state || ''} ${invoiceData.customer.postalCode || ''}</p>` : ''}
          ${invoiceData.customer.country ? `<p style="margin: 5px 0; font-size: 12px;">${invoiceData.customer.country}</p>` : ''}
          ${invoiceData.customer.taxId ? `<p style="margin: 5px 0; font-size: 12px;"><strong>Tax ID:</strong> ${invoiceData.customer.taxId}</p>` : ''}
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Qty</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Unit Price</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">
                    <div style="font-weight: bold;">${item.name}</div>
                    ${item.description ? `<div style="font-size: 10px; color: #666;">${item.description}</div>` : ''}
                    ${item.sku ? `<div style="font-size: 10px; color: #999;">SKU: ${item.sku}</div>` : ''}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currencySymbol}${item.unitPrice.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${currencySymbol}${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div style="width: 300px; margin-left: auto; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
            <span>Subtotal:</span>
            <span>${currencySymbol}${invoiceData.subtotal.toFixed(2)}</span>
          </div>
          ${invoiceData.totalDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #28a745;">
              <span>Total Discount:</span>
              <span>-${currencySymbol}${invoiceData.totalDiscount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${invoiceData.totalTax > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
              <span>Total Tax:</span>
              <span>${currencySymbol}${invoiceData.totalTax.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="border-top: 2px solid #333; padding-top: 5px; margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
              <span>Total Amount:</span>
              <span>${currencySymbol}${invoiceData.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          ${invoiceData.paidAmount > 0 ? `
            <div style="margin-top: 10px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #28a745;">
                <span>Paid:</span>
                <span>${currencySymbol}${invoiceData.paidAmount.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: ${invoiceData.balanceDue > 0 ? '#dc3545' : '#28a745'};">
                <span>Balance Due:</span>
                <span>${currencySymbol}${invoiceData.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Payment Info -->
        ${invoiceData.payments.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payment Information</h3>
            ${invoiceData.payments.map(payment => `
              <div style="background-color: #f8f9fa; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: bold; font-size: 14px;">${payment.method.replace('_', ' ').toUpperCase()}</div>
                    <div style="font-size: 12px; color: #666;">
                      ${new Date(payment.date).toLocaleDateString()}
                      ${payment.reference ? `• Ref: ${payment.reference}` : ''}
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: bold; font-size: 14px;">${currencySymbol}${payment.amount.toFixed(2)}</div>
                    <div style="font-size: 10px; padding: 2px 6px; background-color: ${payment.status === 'completed' ? '#28a745' : '#6c757d'}; color: white; border-radius: 3px; display: inline-block;">
                      ${payment.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Terms -->
        ${invoiceData.terms ? `
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Terms & Conditions</h3>
            <p style="font-size: 12px; color: #666; white-space: pre-line;">${invoiceData.terms}</p>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="margin: 0; font-size: 14px; font-weight: bold;">Thank you for your business!</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">
            Contact: (555) 123-4567 | info@business.com | www.business.com
          </p>
        </div>
      </div>
    `
  }

  private static addWatermark(pdf: jsPDF, text: string): void {
    const pageCount = pdf.getNumberOfPages()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      
      // Set transparency
      pdf.setGState({ opacity: 0.1 })
      
      // Add watermark text
      pdf.setFontSize(50)
      pdf.setTextColor(128, 128, 128)
      
      // Rotate text for diagonal watermark
      const angle = -45
      const x = pageWidth / 2
      const y = pageHeight / 2
      
      pdf.textWithLink(text, x, y, { angle })
      
      // Reset transparency
      pdf.setGState({ opacity: 1 })
    }
  }

  static async generateThermalReceipt(
    invoiceData: InvoiceData,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    const thermalOptions: PDFGenerationOptions = {
      format: 'A4',
      orientation: 'portrait',
      ...options
    }

    try {
      // Create thermal receipt HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = this.generateThermalHTML(invoiceData)
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      tempDiv.style.width = '80mm'
      tempDiv.style.fontFamily = 'monospace'
      tempDiv.style.fontSize = '12px'
      document.body.appendChild(tempDiv)

      try {
        const pdf = await this.generateFromHTML(tempDiv, thermalOptions)
        return pdf
      } finally {
        document.body.removeChild(tempDiv)
      }
    } catch (error) {
      console.error('Thermal receipt generation error:', error)
      throw new Error('Failed to generate thermal receipt')
    }
  }

  private static generateThermalHTML(invoiceData: InvoiceData): string {
    const currencySymbol = getCurrencySymbol()

    return `
      <div style="font-family: monospace; font-size: 12px; padding: 10px; width: 80mm;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="font-weight: bold; font-size: 14px;">YOUR BUSINESS</div>
          <div style="font-size: 10px;">123 Business St</div>
          <div style="font-size: 10px;">Tel: (555) 123-4567</div>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin: 10px 0; text-align: center;">
          <div style="font-weight: bold;">INVOICE</div>
          <div>#${invoiceData.invoiceNumber}</div>
          <div>${new Date(invoiceData.date).toLocaleDateString()}</div>
        </div>

        <!-- Customer -->
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold;">Customer:</div>
          <div>${invoiceData.customer.name}</div>
          ${invoiceData.customer.phone ? `<div>${invoiceData.customer.phone}</div>` : ''}
        </div>

        <!-- Items -->
        <div style="margin-bottom: 10px;">
          ${invoiceData.items.map(item => `
            <div style="margin-bottom: 5px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: bold;">${item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}</span>
                <span>${currencySymbol}${item.totalPrice.toFixed(2)}</span>
              </div>
              <div style="color: #666;">
                ${item.quantity} x ${currencySymbol}${item.unitPrice.toFixed(2)}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Summary -->
        <div style="border-top: 1px dashed #000; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>Subtotal:</span>
            <span>${currencySymbol}${invoiceData.subtotal.toFixed(2)}</span>
          </div>
          ${invoiceData.totalDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Discount:</span>
              <span>-${currencySymbol}${invoiceData.totalDiscount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${invoiceData.totalTax > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Tax:</span>
              <span>${currencySymbol}${invoiceData.totalTax.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px dashed #000; padding-top: 3px;">
            <span>TOTAL:</span>
            <span>${currencySymbol}${invoiceData.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        ${invoiceData.paidAmount > 0 ? `
          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Paid:</span>
              <span>${currencySymbol}${invoiceData.paidAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>Balance:</span>
              <span>${currencySymbol}${invoiceData.balanceDue.toFixed(2)}</span>
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000;">
          <div>Thank you!</div>
          <div style="font-size: 10px;">(555) 123-4567</div>
        </div>

        ${invoiceData.barcode ? `
          <div style="text-align: center; margin-top: 10px;">
            <div style="font-family: monospace; font-size: 10px;">${invoiceData.barcode}</div>
          </div>
        ` : ''}
      </div>
    `
  }

  static downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  static async printPDF(blob: Blob): Promise<void> {
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
          URL.revokeObjectURL(url)
        }, 1000)
      }
    } else {
      URL.revokeObjectURL(url)
      throw new Error('Could not open print window')
    }
  }
}