interface EmailAttachment {
  filename: string
  content: Blob | string
  contentType: string
}

interface EmailOptions {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  body: string
  isHTML?: boolean
  attachments?: EmailAttachment[]
  template?: 'invoice' | 'receipt' | 'reminder' | 'thank-you'
}

interface InvoiceEmailData {
  customerName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  totalAmount: number
  currency: string
  businessName: string
  businessContact: string
  paymentLink?: string
  viewOnlineLink?: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export class EmailService {
  private static readonly DEFAULT_FROM = 'noreply@yourbusiness.com'
  private static readonly DEFAULT_BUSINESS_NAME = 'Your Business'

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In a real implementation, you would integrate with an email service
      // like SendGrid, Mailgun, AWS SES, or your own SMTP server
      console.log('Sending email:', options)
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return true
    } catch (error) {
      console.error('Email sending error:', error)
      return false
    }
  }

  static async sendInvoice(
    email: string,
    invoiceData: InvoiceEmailData,
    pdfBlob: Blob,
    options: Partial<EmailOptions> = {}
  ): Promise<boolean> {
    const subject = `Invoice #${invoiceData.invoiceNumber} from ${invoiceData.businessName}`
    const body = this.generateInvoiceEmailBody(invoiceData)

    const emailOptions: EmailOptions = {
      to: email,
      subject,
      body,
      isHTML: true,
      attachments: [
        {
          filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
          content: pdfBlob,
          contentType: 'application/pdf'
        }
      ],
      template: 'invoice',
      ...options
    }

    return this.sendEmail(emailOptions)
  }

  static async sendReceipt(
    email: string,
    invoiceData: InvoiceEmailData,
    pdfBlob: Blob,
    options: Partial<EmailOptions> = {}
  ): Promise<boolean> {
    const subject = `Receipt #${invoiceData.invoiceNumber} from ${invoiceData.businessName}`
    const body = this.generateReceiptEmailBody(invoiceData)

    const emailOptions: EmailOptions = {
      to: email,
      subject,
      body,
      isHTML: true,
      attachments: [
        {
          filename: `receipt-${invoiceData.invoiceNumber}.pdf`,
          content: pdfBlob,
          contentType: 'application/pdf'
        }
      ],
      template: 'receipt',
      ...options
    }

    return this.sendEmail(emailOptions)
  }

  static async sendPaymentReminder(
    email: string,
    invoiceData: InvoiceEmailData,
    daysOverdue: number,
    options: Partial<EmailOptions> = {}
  ): Promise<boolean> {
    const subject = `Payment Reminder: Invoice #${invoiceData.invoiceNumber} is ${daysOverdue} days overdue`
    const body = this.generateReminderEmailBody(invoiceData, daysOverdue)

    const emailOptions: EmailOptions = {
      to: email,
      subject,
      body,
      isHTML: true,
      template: 'reminder',
      ...options
    }

    return this.sendEmail(emailOptions)
  }

  static async sendThankYou(
    email: string,
    invoiceData: InvoiceEmailData,
    options: Partial<EmailOptions> = {}
  ): Promise<boolean> {
    const subject = `Thank you for your payment - Invoice #${invoiceData.invoiceNumber}`
    const body = this.generateThankYouEmailBody(invoiceData)

    const emailOptions: EmailOptions = {
      to: email,
      subject,
      body,
      isHTML: true,
      template: 'thank-you',
      ...options
    }

    return this.sendEmail(emailOptions)
  }

  private static generateInvoiceEmailBody(data: InvoiceEmailData): string {
    const currencySymbol = this.getCurrencySymbol(data.currency)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${data.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .invoice-details { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background: #f8f9fa; }
          .total-section { text-align: right; margin: 20px 0; }
          .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.businessName}</h1>
            <p>Invoice #${data.invoiceNumber}</p>
          </div>
          
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Thank you for your business. Please find your invoice details below:</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> #${data.invoiceNumber}</p>
              <p><strong>Invoice Date:</strong> ${new Date(data.invoiceDate).toLocaleDateString()}</p>
              ${data.dueDate ? `<p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>` : ''}
              <p><strong>Total Amount:</strong> ${currencySymbol}${data.totalAmount.toFixed(2)}</p>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${currencySymbol}${item.unitPrice.toFixed(2)}</td>
                    <td>${currencySymbol}${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-section">
              <p><strong>Total Amount Due: ${currencySymbol}${data.totalAmount.toFixed(2)}</strong></p>
            </div>

            ${data.paymentLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.paymentLink}" class="button">Pay Invoice Online</a>
              </div>
            ` : ''}

            ${data.viewOnlineLink ? `
              <div style="text-align: center; margin: 20px 0;">
                <a href="${data.viewOnlineLink}" class="button" style="background: #6c757d;">View Invoice Online</a>
              </div>
            ` : ''}

            <p>Please contact us if you have any questions about this invoice.</p>
            <p>Best regards,<br>${data.businessName}<br>${data.businessContact}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static generateReceiptEmailBody(data: InvoiceEmailData): string {
    const currencySymbol = this.getCurrencySymbol(data.currency)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt #${data.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .receipt-details { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background: #f8f9fa; }
          .total-section { text-align: right; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Received</h1>
            <p>Receipt #${data.invoiceNumber}</p>
          </div>
          
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Thank you for your payment! Your payment has been successfully processed.</p>
            
            <div class="receipt-details">
              <p><strong>Receipt Number:</strong> #${data.invoiceNumber}</p>
              <p><strong>Payment Date:</strong> ${new Date(data.invoiceDate).toLocaleDateString()}</p>
              <p><strong>Amount Paid:</strong> ${currencySymbol}${data.totalAmount.toFixed(2)}</p>
            </div>

            <h3>Payment Summary</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${currencySymbol}${item.unitPrice.toFixed(2)}</td>
                    <td>${currencySymbol}${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-section">
              <p><strong>Total Paid: ${currencySymbol}${data.totalAmount.toFixed(2)}</strong></p>
            </div>

            <p>We appreciate your business and look forward to serving you again.</p>
            <p>Best regards,<br>${data.businessName}<br>${data.businessContact}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static generateReminderEmailBody(data: InvoiceEmailData, daysOverdue: number): string {
    const currencySymbol = this.getCurrencySymbol(data.currency)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder - Invoice #${data.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; border: 2px solid #dc3545; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .invoice-details { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
            <p>Invoice #${data.invoiceNumber} is ${daysOverdue} days overdue</p>
          </div>
          
          <div class="content">
            <div class="alert">
              <p><strong>Attention:</strong> Your payment is overdue. Please settle your outstanding balance as soon as possible.</p>
            </div>

            <p>Dear ${data.customerName},</p>
            <p>This is a reminder that your payment for invoice #${data.invoiceNumber} is now ${daysOverdue} days overdue.</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> #${data.invoiceNumber}</p>
              <p><strong>Invoice Date:</strong> ${new Date(data.invoiceDate).toLocaleDateString()}</p>
              ${data.dueDate ? `<p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>` : ''}
              <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
              <p><strong>Outstanding Amount:</strong> ${currencySymbol}${data.totalAmount.toFixed(2)}</p>
            </div>

            ${data.paymentLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.paymentLink}" class="button">Pay Now</a>
              </div>
            ` : ''}

            <p>If you have already made this payment, please disregard this notice. If you believe there is an error or need to make payment arrangements, please contact us immediately.</p>
            <p>Please contact our billing department if you have any questions or concerns about this invoice.</p>
            <p>Best regards,<br>${data.businessName}<br>${data.businessContact}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static generateThankYouEmailBody(data: InvoiceEmailData): string {
    const currencySymbol = this.getCurrencySymbol(data.currency)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You - Invoice #${data.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .thank-you { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
          .payment-details { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You!</h1>
            <p>Payment Received - Invoice #${data.invoiceNumber}</p>
          </div>
          
          <div class="content">
            <div class="thank-you">
              <h2>Payment Successful!</h2>
              <p>Thank you for your prompt payment.</p>
            </div>

            <p>Dear ${data.customerName},</p>
            <p>We have successfully received your payment of ${currencySymbol}${data.totalAmount.toFixed(2)} for invoice #${data.invoiceNumber}.</p>
            
            <div class="payment-details">
              <p><strong>Invoice Number:</strong> #${data.invoiceNumber}</p>
              <p><strong>Payment Date:</strong> ${new Date(data.invoiceDate).toLocaleDateString()}</p>
              <p><strong>Amount Paid:</strong> ${currencySymbol}${data.totalAmount.toFixed(2)}</p>
              <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Paid in Full</span></p>
            </div>

            <p>We truly appreciate your business and value your trust in ${data.businessName}. Your prompt payment helps us continue to provide the quality products and services you expect.</p>
            
            <p>If you need any additional services or have questions about your account, please don't hesitate to contact us.</p>
            
            <p>We look forward to serving you again in the future.</p>
            
            <p>Best regards,<br>${data.businessName}<br>${data.businessContact}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'BDT': '৳'
    }
    return symbols[currency] || currency
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static async sendBulkEmails(
    recipients: Array<{ email: string; data: InvoiceEmailData }>,
    pdfGenerator: (data: InvoiceEmailData) => Promise<Blob>,
    emailType: 'invoice' | 'receipt' | 'reminder' | 'thank-you' = 'invoice'
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const recipient of recipients) {
      try {
        const pdfBlob = await pdfGenerator(recipient.data)
        let success = false

        switch (emailType) {
          case 'invoice':
            success = await this.sendInvoice(recipient.email, recipient.data, pdfBlob)
            break
          case 'receipt':
            success = await this.sendReceipt(recipient.email, recipient.data, pdfBlob)
            break
          case 'reminder':
            success = await this.sendPaymentReminder(recipient.email, recipient.data, 30) // Default 30 days overdue
            break
          case 'thank-you':
            success = await this.sendThankYou(recipient.email, recipient.data)
            break
        }

        if (success) {
          results.success++
        } else {
          results.failed++
          results.errors.push(`Failed to send email to ${recipient.email}`)
        }
      } catch (error) {
        results.failed++
        results.errors.push(`Error sending to ${recipient.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return results
  }
}