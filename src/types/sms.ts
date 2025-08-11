// SMS Gateway Configuration Types
export interface SMSSettings {
  enabled: boolean
  gateway: {
    provider: 'twilio' | 'ssl_wireless' | 'msg91' | 'nexmo' | 'africas_talking' | 'custom'
    apiUrl: string
    apiKey: string
    apiSecret?: string
    senderId: string
    httpMethod: 'GET' | 'POST'
    messageParam: string
    receiverParam: string
    additionalHeaders?: Record<string, string>
    additionalParams?: Record<string, string>
  }
  triggers: {
    newSale: {
      enabled: boolean
      template: string
      includeInvoice: boolean
    }
    dueReminder: {
      enabled: boolean
      template: string
      daysBefore: number[]
    }
    dailySalesSummary: {
      enabled: boolean
      template: string
      recipients: string[]
      time: string // HH:mm format
    }
    otp: {
      enabled: boolean
      template: string
      expiryMinutes: number
    }
    deliveryUpdate: {
      enabled: boolean
      templates: {
        outForDelivery: string
        delivered: string
        failed: string
        cancelled: string
      }
    }
  }
  testSettings: {
    lastTestNumber?: string
    lastTestDate?: Date
    lastTestStatus?: 'success' | 'failed'
    lastTestMessage?: string
  }
}

export interface SMSMessage {
  to: string
  message: string
  from?: string
}

export interface SMSGatewayResponse {
  success: boolean
  messageId?: string
  error?: string
  response?: any
}

export interface PredefinedGateway {
  id: string
  name: string
  description: string
  config: {
    apiUrl: string
    httpMethod: 'GET' | 'POST'
    messageParam: string
    receiverParam: string
    additionalHeaders?: Record<string, string>
    additionalParams?: Record<string, string>
    requiredFields: string[]
  }
}

export const PREDEFINED_GATEWAYS: PredefinedGateway[] = [
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Popular cloud communications platform',
    config: {
      apiUrl: 'https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json',
      httpMethod: 'POST',
      messageParam: 'Body',
      receiverParam: 'To',
      additionalHeaders: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      additionalParams: {
        'From': '{senderId}'
      },
      requiredFields: ['accountSid', 'authToken']
    }
  },
  {
    id: 'ssl_wireless',
    name: 'SSL Wireless',
    description: 'Bangladesh-based SMS gateway',
    config: {
      apiUrl: 'https://sms.sslwireless.com/pushapi/dynamic/server.php',
      httpMethod: 'POST',
      messageParam: 'sms',
      receiverParam: 'msisdn',
      additionalParams: {
        'user': '{apiKey}',
        'pass': '{apiSecret}',
        'sid': '{senderId}'
      },
      requiredFields: ['apiKey', 'apiSecret', 'senderId']
    }
  },
  {
    id: 'msg91',
    name: 'MSG91',
    description: 'Indian SMS gateway with global reach',
    config: {
      apiUrl: 'https://control.msg91.com/api/sendhttp.php',
      httpMethod: 'GET',
      messageParam: 'message',
      receiverParam: 'mobile',
      additionalParams: {
        'authkey': '{apiKey}',
        'sender': '{senderId}',
        'route': '4'
      },
      requiredFields: ['apiKey', 'senderId']
    }
  },
  {
    id: 'nexmo',
    name: 'Nexmo (Vonage)',
    description: 'Global cloud communications platform',
    config: {
      apiUrl: 'https://rest.nexmo.com/sms/json',
      httpMethod: 'POST',
      messageParam: 'text',
      receiverParam: 'to',
      additionalParams: {
        'from': '{senderId}',
        'api_key': '{apiKey}',
        'api_secret': '{apiSecret}'
      },
      requiredFields: ['apiKey', 'apiSecret', 'senderId']
    }
  },
  {
    id: 'africas_talking',
    name: 'Africa\'s Talking',
    description: 'Pan-African communications platform',
    config: {
      apiUrl: 'https://api.africastalking.com/version1/messaging',
      httpMethod: 'POST',
      messageParam: 'message',
      receiverParam: 'to',
      additionalHeaders: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      additionalParams: {
        'username': '{apiKey}',
        'from': '{senderId}'
      },
      requiredFields: ['apiKey', 'senderId']
    }
  }
]

// Default SMS templates
export const DEFAULT_SMS_TEMPLATES = {
  newSale: 'Thank you for your purchase! Your invoice #{invoiceId} for {amount} has been processed. {storeName}',
  dueReminder: 'Dear {customerName}, you have a pending payment of {amount} due on {dueDate}. Please pay at your earliest convenience. {storeName}',
  dailySalesSummary: 'Daily Sales Summary - {date}: Total Sales: {totalSales}, Transactions: {transactionCount}, Average: {averageTransaction}',
  otp: 'Your OTP code is {otp}. Valid for {expiryMinutes} minutes. Do not share this code.',
  outForDelivery: 'Your order #{orderId} is out for delivery! Expected delivery: {estimatedTime}. Track: {trackingUrl}',
  delivered: 'Your order #{orderId} has been delivered successfully! Thank you for shopping with {storeName}.',
  failed: 'Your order #{orderId} delivery failed. We will contact you soon to reschedule. {storeName}',
  cancelled: 'Your order #{orderId} has been cancelled. Refund will be processed within 3-5 business days. {storeName}'
}