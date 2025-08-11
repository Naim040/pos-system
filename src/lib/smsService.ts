import { SMSSettings, SMSMessage, SMSGatewayResponse, PREDEFINED_GATEWAYS } from '@/types/sms'

export class SMSService {
  private static instance: SMSService
  private settings: SMSSettings | null = null

  private constructor() {}

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService()
    }
    return SMSService.instance
  }

  async loadSettings(): Promise<SMSSettings | null> {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        this.settings = data.sms
        return this.settings
      }
    } catch (error) {
      console.error('Error loading SMS settings:', error)
    }
    return null
  }

  async sendSMS(to: string, message: string, customSettings?: SMSSettings): Promise<SMSGatewayResponse> {
    const settings = customSettings || this.settings || await this.loadSettings()
    
    if (!settings || !settings.enabled) {
      return {
        success: false,
        error: 'SMS service is not enabled or configured'
      }
    }

    if (!settings.gateway.apiUrl || !settings.gateway.apiKey) {
      return {
        success: false,
        error: 'SMS gateway is not properly configured'
      }
    }

    try {
      const gateway = settings.gateway
      let url = gateway.apiUrl
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...gateway.additionalHeaders
      }
      let body: any = {}

      // Replace placeholders in URL
      url = this.replacePlaceholders(url, gateway)

      // Prepare parameters based on HTTP method
      if (gateway.httpMethod === 'GET') {
        const params = new URLSearchParams()
        params.append(gateway.receiverParam, to)
        params.append(gateway.messageParam, message)

        // Add additional parameters
        if (gateway.additionalParams) {
          Object.entries(gateway.additionalParams).forEach(([key, value]) => {
            params.append(key, this.replacePlaceholders(value, gateway))
          })
        }

        url += `?${params.toString()}`
      } else {
        // POST request
        body[gateway.receiverParam] = to
        body[gateway.messageParam] = message

        // Add additional parameters
        if (gateway.additionalParams) {
          Object.entries(gateway.additionalParams).forEach(([key, value]) => {
            body[key] = this.replacePlaceholders(value, gateway)
          })
        }

        // For form-encoded content
        if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
          body = new URLSearchParams(body as Record<string, string>).toString()
        }
      }

      const response = await fetch(url, {
        method: gateway.httpMethod,
        headers,
        body: gateway.httpMethod === 'POST' ? body : undefined
      })

      const responseData = await response.text()
      
      // Try to parse as JSON, fallback to text
      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseData)
      } catch {
        parsedResponse = responseData
      }

      if (response.ok) {
        return {
          success: true,
          messageId: this.extractMessageId(parsedResponse),
          response: parsedResponse
        }
      } else {
        return {
          success: false,
          error: this.extractErrorMessage(parsedResponse) || `HTTP ${response.status}: ${response.statusText}`,
          response: parsedResponse
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async sendTestSMS(to: string, message: string = 'This is a test message from POS System'): Promise<SMSGatewayResponse> {
    const result = await this.sendSMS(to, message)
    
    // Update test settings
    if (this.settings) {
      this.settings.testSettings = {
        lastTestNumber: to,
        lastTestDate: new Date(),
        lastTestStatus: result.success ? 'success' : 'failed',
        lastTestMessage: result.error || message
      }
      
      // Save updated settings
      try {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sms: this.settings })
        })
      } catch (error) {
        console.error('Error saving test settings:', error)
      }
    }
    
    return result
  }

  async sendNewSaleSMS(customerPhone: string, data: {
    invoiceId: string
    amount: number
    storeName: string
    customerName?: string
  }): Promise<SMSGatewayResponse> {
    if (!this.settings?.triggers.newSale.enabled) {
      return { success: false, error: 'New sale SMS trigger is disabled' }
    }

    const template = this.settings.triggers.newSale.template
    const message = this.renderTemplate(template, {
      invoiceId: data.invoiceId,
      amount: data.amount.toFixed(2),
      storeName: data.storeName,
      customerName: data.customerName || 'Valued Customer'
    })

    return await this.sendSMS(customerPhone, message)
  }

  async sendDueReminderSMS(customerPhone: string, data: {
    customerName: string
    amount: number
    dueDate: string
    storeName: string
  }): Promise<SMSGatewayResponse> {
    if (!this.settings?.triggers.dueReminder.enabled) {
      return { success: false, error: 'Due reminder SMS trigger is disabled' }
    }

    const template = this.settings.triggers.dueReminder.template
    const message = this.renderTemplate(template, {
      customerName: data.customerName,
      amount: data.amount.toFixed(2),
      dueDate: data.dueDate,
      storeName: data.storeName
    })

    return await this.sendSMS(customerPhone, message)
  }

  async sendDailySalesSummarySMS(recipients: string[], data: {
    date: string
    totalSales: number
    transactionCount: number
    averageTransaction: number
    storeName: string
  }): Promise<SMSGatewayResponse[]> {
    if (!this.settings?.triggers.dailySalesSummary.enabled) {
      return [{ success: false, error: 'Daily sales summary SMS trigger is disabled' }]
    }

    const template = this.settings.triggers.dailySalesSummary.template
    const message = this.renderTemplate(template, {
      date: data.date,
      totalSales: data.totalSales.toFixed(2),
      transactionCount: data.transactionCount.toString(),
      averageTransaction: data.averageTransaction.toFixed(2),
      storeName: data.storeName
    })

    const results: SMSGatewayResponse[] = []
    for (const recipient of recipients) {
      const result = await this.sendSMS(recipient, message)
      results.push(result)
    }

    return results
  }

  async sendOTPSMS(phone: string, otp: string): Promise<SMSGatewayResponse> {
    if (!this.settings?.triggers.otp.enabled) {
      return { success: false, error: 'OTP SMS trigger is disabled' }
    }

    const template = this.settings.triggers.otp.template
    const message = this.renderTemplate(template, {
      otp,
      expiryMinutes: this.settings.triggers.otp.expiryMinutes.toString()
    })

    return await this.sendSMS(phone, message)
  }

  async sendDeliveryUpdateSMS(customerPhone: string, data: {
    orderId: string
    status: 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled'
    estimatedTime?: string
    trackingUrl?: string
    storeName: string
  }): Promise<SMSGatewayResponse> {
    if (!this.settings?.triggers.deliveryUpdate.enabled) {
      return { success: false, error: 'Delivery update SMS trigger is disabled' }
    }

    const templates = this.settings.triggers.deliveryUpdate.templates
    let template: string

    switch (data.status) {
      case 'out_for_delivery':
        template = templates.outForDelivery
        break
      case 'delivered':
        template = templates.delivered
        break
      case 'failed':
        template = templates.failed
        break
      case 'cancelled':
        template = templates.cancelled
        break
      default:
        return { success: false, error: 'Invalid delivery status' }
    }

    const message = this.renderTemplate(template, {
      orderId: data.orderId,
      estimatedTime: data.estimatedTime || '',
      trackingUrl: data.trackingUrl || '',
      storeName: data.storeName
    })

    return await this.sendSMS(customerPhone, message)
  }

  getPredefinedGateway(providerId: string) {
    return PREDEFINED_GATEWAYS.find(gateway => gateway.id === providerId)
  }

  applyPredefinedGateway(providerId: string, currentSettings: SMSSettings): SMSSettings {
    const gateway = this.getPredefinedGateway(providerId)
    if (!gateway) return currentSettings

    return {
      ...currentSettings,
      gateway: {
        ...currentSettings.gateway,
        provider: providerId as any,
        apiUrl: gateway.config.apiUrl,
        httpMethod: gateway.config.httpMethod,
        messageParam: gateway.config.messageParam,
        receiverParam: gateway.config.receiverParam,
        additionalHeaders: gateway.config.additionalHeaders || {},
        additionalParams: gateway.config.additionalParams || {}
      }
    }
  }

  private replacePlaceholders(text: string, gateway: SMSSettings['gateway']): string {
    return text
      .replace(/\{apiKey\}/g, gateway.apiKey)
      .replace(/\{apiSecret\}/g, gateway.apiSecret || '')
      .replace(/\{senderId\}/g, gateway.senderId)
      .replace(/\{accountSid\}/g, gateway.apiKey) // For Twilio compatibility
      .replace(/\{authToken\}/g, gateway.apiSecret || '') // For Twilio compatibility
  }

  private renderTemplate(template: string, data: Record<string, string>): string {
    let result = template
    Object.entries(data).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    })
    return result
  }

  private extractMessageId(response: any): string | undefined {
    // Common message ID fields across different gateways
    const possibleFields = [
      'message_id',
      'messageId',
      'sid',
      'id',
      'message_uuid',
      'SMSMessageData',
      'messages'
    ]

    for (const field of possibleFields) {
      if (response[field]) {
        if (typeof response[field] === 'string') {
          return response[field]
        }
        if (Array.isArray(response[field]) && response[field].length > 0) {
          return response[field][0].id || response[field][0].message_id
        }
      }
    }

    return undefined
  }

  private extractErrorMessage(response: any): string | undefined {
    // Common error fields across different gateways
    const possibleFields = [
      'error',
      'message',
      'error_message',
      'errorMessage',
      'status',
      'code'
    ]

    for (const field of possibleFields) {
      if (response[field]) {
        if (typeof response[field] === 'string') {
          return response[field]
        }
        if (typeof response[field] === 'object' && response[field].message) {
          return response[field].message
        }
      }
    }

    return undefined
  }
}

export const smsService = SMSService.getInstance()