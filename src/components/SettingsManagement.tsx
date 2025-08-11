"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { useNavigationLayout } from '@/hooks/useNavigationLayout'
import { 
  Settings, 
  Store, 
  Printer, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Globe, 
  CreditCard,
  Calculator,
  Users,
  FileText,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  Save,
  RotateCcw,
  Download,
  Upload,
  Receipt,
  MessageSquare,
  Send,
  TestTube
} from 'lucide-react'
import InvoiceSettingsEditor from './InvoiceSettingsEditor'
import { SMSSettings, PREDEFINED_GATEWAYS } from '@/types/sms'

interface StoreSettings {
  name: string
  address: string
  phone: string
  email: string
  taxRate: number
  currency: string
  timezone: string
  logo?: string
}

interface PrinterSettings {
  receiptPrinter: string
  labelPrinter: string
  autoPrint: boolean
  printCopies: number
  receiptHeader: string
  receiptFooter: string
}

interface NotificationSettings {
  lowStockAlerts: boolean
  salesNotifications: boolean
  customerNotifications: boolean
  employeeNotifications: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

interface SecuritySettings {
  sessionTimeout: number
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
  twoFactorAuth: boolean
  auditLog: boolean
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  fontSize: 'small' | 'medium' | 'large'
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  navigationLayout: 'horizontal' | 'vertical'
}

interface PaymentSettings {
  cashEnabled: boolean
  cardEnabled: boolean
  mobilePayEnabled: boolean
  defaultPaymentMethod: string
  tipEnabled: boolean
  tipPercentages: number[]
  partialPayments: boolean
}

interface TaxSettings {
  enabled: boolean
  inclusive: boolean
  defaultRate: number
  taxRules: Array<{
    id: string
    name: string
    rate: number
    category: string
  }>
}

interface SMSSettingsState {
  enabled: boolean
  gateway: {
    provider: 'twilio' | 'ssl_wireless' | 'msg91' | 'nexmo' | 'africas_talking' | 'custom'
    apiUrl: string
    apiKey: string
    apiSecret: string
    senderId: string
    httpMethod: 'GET' | 'POST'
    messageParam: string
    receiverParam: string
    additionalHeaders: string
    additionalParams: string
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
      recipients: string
      time: string
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
    lastTestDate?: string
    lastTestStatus?: 'success' | 'failed'
    lastTestMessage?: string
  }
}

export default function SettingsManagement() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const { saveLayoutPreference } = useNavigationLayout()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxRate: 8.5,
    currency: 'BDT',
    timezone: 'UTC-5',
    logo: ''
  })

  // Printer Settings
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    receiptPrinter: '',
    labelPrinter: '',
    autoPrint: true,
    printCopies: 1,
    receiptHeader: '',
    receiptFooter: 'Thank you for your business!'
  })

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    lowStockAlerts: true,
    salesNotifications: true,
    customerNotifications: false,
    employeeNotifications: true,
    emailNotifications: true,
    pushNotifications: true
  })

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    twoFactorAuth: false,
    auditLog: true
  })

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    primaryColor: '#3b82f6',
    fontSize: 'medium',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    navigationLayout: 'horizontal'
  })

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    cashEnabled: true,
    cardEnabled: true,
    mobilePayEnabled: false,
    defaultPaymentMethod: 'cash',
    tipEnabled: true,
    tipPercentages: [15, 18, 20, 25],
    partialPayments: true
  })

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    enabled: true,
    inclusive: false,
    defaultRate: 8.5,
    taxRules: []
  })

  // SMS Settings
  const [smsSettings, setSmsSettings] = useState<SMSSettingsState>({
    enabled: false,
    gateway: {
      provider: 'custom',
      apiUrl: '',
      apiKey: '',
      apiSecret: '',
      senderId: '',
      httpMethod: 'POST',
      messageParam: 'message',
      receiverParam: 'to',
      additionalHeaders: '{}',
      additionalParams: '{}'
    },
    triggers: {
      newSale: {
        enabled: false,
        template: 'Thank you for your purchase! Your invoice #{invoiceId} for {amount} has been processed. {storeName}',
        includeInvoice: true
      },
      dueReminder: {
        enabled: false,
        template: 'Dear {customerName}, you have a pending payment of {amount} due on {dueDate}. Please pay at your earliest convenience. {storeName}',
        daysBefore: [1, 3, 7]
      },
      dailySalesSummary: {
        enabled: false,
        template: 'Daily Sales Summary - {date}: Total Sales: {totalSales}, Transactions: {transactionCount}, Average: {averageTransaction}',
        recipients: '',
        time: '18:00'
      },
      otp: {
        enabled: false,
        template: 'Your OTP code is {otp}. Valid for {expiryMinutes} minutes. Do not share this code.',
        expiryMinutes: 5
      },
      deliveryUpdate: {
        enabled: false,
        templates: {
          outForDelivery: 'Your order #{orderId} is out for delivery! Expected delivery: {estimatedTime}. Track: {trackingUrl}',
          delivered: 'Your order #{orderId} has been delivered successfully! Thank you for shopping with {storeName}.',
          failed: 'Your order #{orderId} delivery failed. We will contact you soon to reschedule. {storeName}.',
          cancelled: 'Your order #{orderId} has been cancelled. Refund will be processed within 3-5 business days. {storeName}.'
        }
      }
    },
    testSettings: {}
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        // Update all settings states with loaded data, providing defaults
        if (data.store) {
          setStoreSettings(prev => ({
            name: data.store.name ?? prev.name,
            address: data.store.address ?? prev.address,
            phone: data.store.phone ?? prev.phone,
            email: data.store.email ?? prev.email,
            taxRate: data.store.taxRate ?? prev.taxRate,
            currency: data.store.currency ?? prev.currency,
            timezone: data.store.timezone ?? prev.timezone,
            logo: data.store.logo ?? prev.logo
          }))
        }
        if (data.printer) {
          setPrinterSettings(prev => ({
            receiptPrinter: data.printer.receiptPrinter ?? prev.receiptPrinter,
            labelPrinter: data.printer.labelPrinter ?? prev.labelPrinter,
            autoPrint: data.printer.autoPrint ?? prev.autoPrint,
            printCopies: data.printer.printCopies ?? prev.printCopies,
            receiptHeader: data.printer.receiptHeader ?? prev.receiptHeader,
            receiptFooter: data.printer.receiptFooter ?? prev.receiptFooter
          }))
        }
        if (data.notifications) {
          setNotificationSettings(prev => ({
            lowStockAlerts: data.notifications.lowStockAlerts ?? prev.lowStockAlerts,
            salesNotifications: data.notifications.salesNotifications ?? prev.salesNotifications,
            customerNotifications: data.notifications.customerNotifications ?? prev.customerNotifications,
            employeeNotifications: data.notifications.employeeNotifications ?? prev.employeeNotifications,
            emailNotifications: data.notifications.emailNotifications ?? prev.emailNotifications,
            pushNotifications: data.notifications.pushNotifications ?? prev.pushNotifications
          }))
        }
        if (data.security) {
          setSecuritySettings(prev => ({
            sessionTimeout: data.security.sessionTimeout ?? prev.sessionTimeout,
            passwordPolicy: {
              minLength: data.security.passwordPolicy?.minLength ?? prev.passwordPolicy.minLength,
              requireUppercase: data.security.passwordPolicy?.requireUppercase ?? prev.passwordPolicy.requireUppercase,
              requireNumbers: data.security.passwordPolicy?.requireNumbers ?? prev.passwordPolicy.requireNumbers,
              requireSpecialChars: data.security.passwordPolicy?.requireSpecialChars ?? prev.passwordPolicy.requireSpecialChars
            },
            twoFactorAuth: data.security.twoFactorAuth ?? prev.twoFactorAuth,
            auditLog: data.security.auditLog ?? prev.auditLog
          }))
        }
        if (data.appearance) {
          setAppearanceSettings(prev => ({
            theme: data.appearance.theme ?? prev.theme,
            primaryColor: data.appearance.primaryColor ?? prev.primaryColor,
            fontSize: data.appearance.fontSize ?? prev.fontSize,
            language: data.appearance.language ?? prev.language,
            dateFormat: data.appearance.dateFormat ?? prev.dateFormat,
            timeFormat: data.appearance.timeFormat ?? prev.timeFormat,
            navigationLayout: data.appearance.navigationLayout ?? prev.navigationLayout
          }))
        }
        if (data.payments) {
          setPaymentSettings(prev => ({
            cashEnabled: data.payments.cashEnabled ?? prev.cashEnabled,
            cardEnabled: data.payments.cardEnabled ?? prev.cardEnabled,
            mobilePayEnabled: data.payments.mobilePayEnabled ?? prev.mobilePayEnabled,
            defaultPaymentMethod: data.payments.defaultPaymentMethod ?? prev.defaultPaymentMethod,
            tipEnabled: data.payments.tipEnabled ?? prev.tipEnabled,
            tipPercentages: data.payments.tipPercentages ?? prev.tipPercentages,
            partialPayments: data.payments.partialPayments ?? prev.partialPayments
          }))
        }
        if (data.taxes) {
          setTaxSettings(prev => ({
            enabled: data.taxes.enabled ?? prev.enabled,
            defaultRate: data.taxes.defaultRate ?? prev.defaultRate,
            taxRules: data.taxes.taxRules ?? prev.taxRules
          }))
        }
        if (data.sms) {
          setSmsSettings(prev => ({
            enabled: data.sms.enabled ?? prev.enabled,
            gateway: {
              provider: data.sms.gateway.provider ?? prev.gateway.provider,
              apiUrl: data.sms.gateway.apiUrl ?? prev.gateway.apiUrl,
              apiKey: data.sms.gateway.apiKey ?? prev.gateway.apiKey,
              apiSecret: data.sms.gateway.apiSecret ?? prev.gateway.apiSecret,
              senderId: data.sms.gateway.senderId ?? prev.gateway.senderId,
              httpMethod: data.sms.gateway.httpMethod ?? prev.gateway.httpMethod,
              messageParam: data.sms.gateway.messageParam ?? prev.gateway.messageParam,
              receiverParam: data.sms.gateway.receiverParam ?? prev.gateway.receiverParam,
              additionalHeaders: JSON.stringify(data.sms.gateway.additionalHeaders || {}),
              additionalParams: JSON.stringify(data.sms.gateway.additionalParams || {})
            },
            triggers: {
              newSale: {
                enabled: data.sms.triggers.newSale.enabled ?? prev.triggers.newSale.enabled,
                template: data.sms.triggers.newSale.template ?? prev.triggers.newSale.template,
                includeInvoice: data.sms.triggers.newSale.includeInvoice ?? prev.triggers.newSale.includeInvoice
              },
              dueReminder: {
                enabled: data.sms.triggers.dueReminder.enabled ?? prev.triggers.dueReminder.enabled,
                template: data.sms.triggers.dueReminder.template ?? prev.triggers.dueReminder.template,
                daysBefore: data.sms.triggers.dueReminder.daysBefore ?? prev.triggers.dueReminder.daysBefore
              },
              dailySalesSummary: {
                enabled: data.sms.triggers.dailySalesSummary.enabled ?? prev.triggers.dailySalesSummary.enabled,
                template: data.sms.triggers.dailySalesSummary.template ?? prev.triggers.dailySalesSummary.template,
                recipients: data.sms.triggers.dailySalesSummary.recipients?.join(', ') ?? prev.triggers.dailySalesSummary.recipients,
                time: data.sms.triggers.dailySalesSummary.time ?? prev.triggers.dailySalesSummary.time
              },
              otp: {
                enabled: data.sms.triggers.otp.enabled ?? prev.triggers.otp.enabled,
                template: data.sms.triggers.otp.template ?? prev.triggers.otp.template,
                expiryMinutes: data.sms.triggers.otp.expiryMinutes ?? prev.triggers.otp.expiryMinutes
              },
              deliveryUpdate: {
                enabled: data.sms.triggers.deliveryUpdate.enabled ?? prev.triggers.deliveryUpdate.enabled,
                templates: {
                  outForDelivery: data.sms.triggers.deliveryUpdate.templates.outForDelivery ?? prev.triggers.deliveryUpdate.templates.outForDelivery,
                  delivered: data.sms.triggers.deliveryUpdate.templates.delivered ?? prev.triggers.deliveryUpdate.templates.delivered,
                  failed: data.sms.triggers.deliveryUpdate.templates.failed ?? prev.triggers.deliveryUpdate.templates.failed,
                  cancelled: data.sms.triggers.deliveryUpdate.templates.cancelled ?? prev.triggers.deliveryUpdate.templates.cancelled
                }
              }
            },
            testSettings: {
              lastTestNumber: data.sms.testSettings.lastTestNumber ?? prev.testSettings.lastTestNumber,
              lastTestDate: data.sms.testSettings.lastTestDate ?? prev.testSettings.lastTestDate,
              lastTestStatus: data.sms.testSettings.lastTestStatus ?? prev.testSettings.lastTestStatus,
              lastTestMessage: data.sms.testSettings.lastTestMessage ?? prev.testSettings.lastTestMessage
            }
          }))
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store: storeSettings,
          printer: printerSettings,
          notifications: notificationSettings,
          security: securitySettings,
          appearance: appearanceSettings,
          payments: paymentSettings,
          taxes: taxSettings,
          sms: {
            enabled: smsSettings.enabled,
            gateway: {
              provider: smsSettings.gateway.provider,
              apiUrl: smsSettings.gateway.apiUrl,
              apiKey: smsSettings.gateway.apiKey,
              apiSecret: smsSettings.gateway.apiSecret,
              senderId: smsSettings.gateway.senderId,
              httpMethod: smsSettings.gateway.httpMethod,
              messageParam: smsSettings.gateway.messageParam,
              receiverParam: smsSettings.gateway.receiverParam,
              additionalHeaders: JSON.parse(smsSettings.gateway.additionalHeaders || '{}'),
              additionalParams: JSON.parse(smsSettings.gateway.additionalParams || '{}')
            },
            triggers: {
              newSale: smsSettings.triggers.newSale,
              dueReminder: {
                ...smsSettings.triggers.dueReminder,
                daysBefore: smsSettings.triggers.dueReminder.daysBefore
              },
              dailySalesSummary: {
                ...smsSettings.triggers.dailySalesSummary,
                recipients: smsSettings.triggers.dailySalesSummary.recipients.split(',').map(r => r.trim()).filter(r => r)
              },
              otp: smsSettings.triggers.otp,
              deliveryUpdate: smsSettings.triggers.deliveryUpdate
            },
            testSettings: smsSettings.testSettings
          }
        }),
      })

      if (response.ok) {
        // Save layout preference to database as well
        await saveLayoutPreference(appearanceSettings.navigationLayout, true)
        
        toast({
          title: "Settings saved",
          description: "All settings have been successfully updated",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to default values
      setStoreSettings({
        name: '',
        address: '',
        phone: '',
        email: '',
        taxRate: 8.5,
        currency: 'BDT',
        timezone: 'UTC-5',
        logo: ''
      })
      setPrinterSettings({
        receiptPrinter: '',
        labelPrinter: '',
        autoPrint: true,
        printCopies: 1,
        receiptHeader: '',
        receiptFooter: 'Thank you for your business!'
      })
      setNotificationSettings({
        lowStockAlerts: true,
        salesNotifications: true,
        customerNotifications: false,
        employeeNotifications: true,
        emailNotifications: true,
        pushNotifications: true
      })
      setSecuritySettings({
        sessionTimeout: 30,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        },
        twoFactorAuth: false,
        auditLog: true
      })
      setAppearanceSettings({
        theme: 'light',
        primaryColor: '#3b82f6',
        fontSize: 'medium',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        navigationLayout: 'horizontal'
      })
      setPaymentSettings({
        cashEnabled: true,
        cardEnabled: true,
        mobilePayEnabled: false,
        defaultPaymentMethod: 'cash',
        tipEnabled: true,
        tipPercentages: [15, 18, 20, 25],
        partialPayments: true
      })
      setTaxSettings({
        enabled: true,
        inclusive: false,
        defaultRate: 8.5,
        taxRules: []
      })
      setSmsSettings({
        enabled: false,
        gateway: {
          provider: 'custom',
          apiUrl: '',
          apiKey: '',
          apiSecret: '',
          senderId: '',
          httpMethod: 'POST',
          messageParam: 'message',
          receiverParam: 'to',
          additionalHeaders: '{}',
          additionalParams: '{}'
        },
        triggers: {
          newSale: {
            enabled: false,
            template: 'Thank you for your purchase! Your invoice #{invoiceId} for {amount} has been processed. {storeName}',
            includeInvoice: true
          },
          dueReminder: {
            enabled: false,
            template: 'Dear {customerName}, you have a pending payment of {amount} due on {dueDate}. Please pay at your earliest convenience. {storeName}',
            daysBefore: [1, 3, 7]
          },
          dailySalesSummary: {
            enabled: false,
            template: 'Daily Sales Summary - {date}: Total Sales: {totalSales}, Transactions: {transactionCount}, Average: {averageTransaction}',
            recipients: '',
            time: '18:00'
          },
          otp: {
            enabled: false,
            template: 'Your OTP code is {otp}. Valid for {expiryMinutes} minutes. Do not share this code.',
            expiryMinutes: 5
          },
          deliveryUpdate: {
            enabled: false,
            templates: {
              outForDelivery: 'Your order #{orderId} is out for delivery! Expected delivery: {estimatedTime}. Track: {trackingUrl}',
              delivered: 'Your order #{orderId} has been delivered successfully! Thank you for shopping with {storeName}.',
              failed: 'Your order #{orderId} delivery failed. We will contact you soon to reschedule. {storeName}.',
              cancelled: 'Your order #{orderId} has been cancelled. Refund will be processed within 3-5 business days. {storeName}.'
            }
          }
        },
        testSettings: {}
      })
      
      toast({
        title: "Settings reset",
        description: "All settings have been reset to defaults",
      })
    }
  }

  const exportSettings = () => {
    const settingsData = {
      store: storeSettings,
      printer: printerSettings,
      notifications: notificationSettings,
      security: securitySettings,
      appearance: appearanceSettings,
      payments: paymentSettings,
      taxes: taxSettings,
      sms: smsSettings,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pos-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Settings exported",
      description: "Settings have been exported successfully",
    })
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        
        // Validate and apply imported settings with fallbacks
        if (importedData.store) {
          setStoreSettings(prev => ({
            name: importedData.store.name ?? prev.name,
            address: importedData.store.address ?? prev.address,
            phone: importedData.store.phone ?? prev.phone,
            email: importedData.store.email ?? prev.email,
            taxRate: importedData.store.taxRate ?? prev.taxRate,
            currency: importedData.store.currency ?? prev.currency,
            timezone: importedData.store.timezone ?? prev.timezone,
            logo: importedData.store.logo ?? prev.logo
          }))
        }
        if (importedData.printer) {
          setPrinterSettings(prev => ({
            receiptPrinter: importedData.printer.receiptPrinter ?? prev.receiptPrinter,
            labelPrinter: importedData.printer.labelPrinter ?? prev.labelPrinter,
            autoPrint: importedData.printer.autoPrint ?? prev.autoPrint,
            printCopies: importedData.printer.printCopies ?? prev.printCopies,
            receiptHeader: importedData.printer.receiptHeader ?? prev.receiptHeader,
            receiptFooter: importedData.printer.receiptFooter ?? prev.receiptFooter
          }))
        }
        if (importedData.notifications) {
          setNotificationSettings(prev => ({
            lowStockAlerts: importedData.notifications.lowStockAlerts ?? prev.lowStockAlerts,
            salesNotifications: importedData.notifications.salesNotifications ?? prev.salesNotifications,
            customerNotifications: importedData.notifications.customerNotifications ?? prev.customerNotifications,
            employeeNotifications: importedData.notifications.employeeNotifications ?? prev.employeeNotifications,
            emailNotifications: importedData.notifications.emailNotifications ?? prev.emailNotifications,
            pushNotifications: importedData.notifications.pushNotifications ?? prev.pushNotifications
          }))
        }
        if (importedData.security) {
          setSecuritySettings(prev => ({
            sessionTimeout: importedData.security.sessionTimeout ?? prev.sessionTimeout,
            passwordPolicy: {
              minLength: importedData.security.passwordPolicy?.minLength ?? prev.passwordPolicy.minLength,
              requireUppercase: importedData.security.passwordPolicy?.requireUppercase ?? prev.passwordPolicy.requireUppercase,
              requireNumbers: importedData.security.passwordPolicy?.requireNumbers ?? prev.passwordPolicy.requireNumbers,
              requireSpecialChars: importedData.security.passwordPolicy?.requireSpecialChars ?? prev.passwordPolicy.requireSpecialChars
            },
            twoFactorAuth: importedData.security.twoFactorAuth ?? prev.twoFactorAuth,
            auditLog: importedData.security.auditLog ?? prev.auditLog
          }))
        }
        if (importedData.appearance) {
          setAppearanceSettings(prev => ({
            theme: importedData.appearance.theme ?? prev.theme,
            primaryColor: importedData.appearance.primaryColor ?? prev.primaryColor,
            fontSize: importedData.appearance.fontSize ?? prev.fontSize,
            language: importedData.appearance.language ?? prev.language,
            dateFormat: importedData.appearance.dateFormat ?? prev.dateFormat,
            timeFormat: importedData.appearance.timeFormat ?? prev.timeFormat,
            navigationLayout: importedData.appearance.navigationLayout ?? prev.navigationLayout
          }))
        }
        if (importedData.payments) {
          setPaymentSettings(prev => ({
            cashEnabled: importedData.payments.cashEnabled ?? prev.cashEnabled,
            cardEnabled: importedData.payments.cardEnabled ?? prev.cardEnabled,
            mobilePayEnabled: importedData.payments.mobilePayEnabled ?? prev.mobilePayEnabled,
            defaultPaymentMethod: importedData.payments.defaultPaymentMethod ?? prev.defaultPaymentMethod,
            tipEnabled: importedData.payments.tipEnabled ?? prev.tipEnabled,
            tipPercentages: importedData.payments.tipPercentages ?? prev.tipPercentages,
            partialPayments: importedData.payments.partialPayments ?? prev.partialPayments
          }))
        }
        if (importedData.taxes) {
          setTaxSettings(prev => ({
            enabled: importedData.taxes.enabled ?? prev.enabled,
            defaultRate: importedData.taxes.defaultRate ?? prev.defaultRate,
            taxRules: importedData.taxes.taxRules ?? prev.taxRules
          }))
        }
        if (importedData.sms) {
          setSmsSettings(prev => ({
            enabled: importedData.sms.enabled ?? prev.enabled,
            gateway: {
              provider: importedData.sms.gateway.provider ?? prev.gateway.provider,
              apiUrl: importedData.sms.gateway.apiUrl ?? prev.gateway.apiUrl,
              apiKey: importedData.sms.gateway.apiKey ?? prev.gateway.apiKey,
              apiSecret: importedData.sms.gateway.apiSecret ?? prev.gateway.apiSecret,
              senderId: importedData.sms.gateway.senderId ?? prev.gateway.senderId,
              httpMethod: importedData.sms.gateway.httpMethod ?? prev.gateway.httpMethod,
              messageParam: importedData.sms.gateway.messageParam ?? prev.gateway.messageParam,
              receiverParam: importedData.sms.gateway.receiverParam ?? prev.gateway.receiverParam,
              additionalHeaders: typeof importedData.sms.gateway.additionalHeaders === 'object' 
                ? JSON.stringify(importedData.sms.gateway.additionalHeaders) 
                : importedData.sms.gateway.additionalHeaders ?? prev.gateway.additionalHeaders,
              additionalParams: typeof importedData.sms.gateway.additionalParams === 'object'
                ? JSON.stringify(importedData.sms.gateway.additionalParams)
                : importedData.sms.gateway.additionalParams ?? prev.gateway.additionalParams
            },
            triggers: {
              newSale: {
                enabled: importedData.sms.triggers.newSale.enabled ?? prev.triggers.newSale.enabled,
                template: importedData.sms.triggers.newSale.template ?? prev.triggers.newSale.template,
                includeInvoice: importedData.sms.triggers.newSale.includeInvoice ?? prev.triggers.newSale.includeInvoice
              },
              dueReminder: {
                enabled: importedData.sms.triggers.dueReminder.enabled ?? prev.triggers.dueReminder.enabled,
                template: importedData.sms.triggers.dueReminder.template ?? prev.triggers.dueReminder.template,
                daysBefore: importedData.sms.triggers.dueReminder.daysBefore ?? prev.triggers.dueReminder.daysBefore
              },
              dailySalesSummary: {
                enabled: importedData.sms.triggers.dailySalesSummary.enabled ?? prev.triggers.dailySalesSummary.enabled,
                template: importedData.sms.triggers.dailySalesSummary.template ?? prev.triggers.dailySalesSummary.template,
                recipients: Array.isArray(importedData.sms.triggers.dailySalesSummary.recipients)
                  ? importedData.sms.triggers.dailySalesSummary.recipients.join(', ')
                  : importedData.sms.triggers.dailySalesSummary.recipients ?? prev.triggers.dailySalesSummary.recipients,
                time: importedData.sms.triggers.dailySalesSummary.time ?? prev.triggers.dailySalesSummary.time
              },
              otp: {
                enabled: importedData.sms.triggers.otp.enabled ?? prev.triggers.otp.enabled,
                template: importedData.sms.triggers.otp.template ?? prev.triggers.otp.template,
                expiryMinutes: importedData.sms.triggers.otp.expiryMinutes ?? prev.triggers.otp.expiryMinutes
              },
              deliveryUpdate: {
                enabled: importedData.sms.triggers.deliveryUpdate.enabled ?? prev.triggers.deliveryUpdate.enabled,
                templates: {
                  outForDelivery: importedData.sms.triggers.deliveryUpdate.templates.outForDelivery ?? prev.triggers.deliveryUpdate.templates.outForDelivery,
                  delivered: importedData.sms.triggers.deliveryUpdate.templates.delivered ?? prev.triggers.deliveryUpdate.templates.delivered,
                  failed: importedData.sms.triggers.deliveryUpdate.templates.failed ?? prev.triggers.deliveryUpdate.templates.failed,
                  cancelled: importedData.sms.triggers.deliveryUpdate.templates.cancelled ?? prev.triggers.deliveryUpdate.templates.cancelled
                }
              }
            },
            testSettings: {
              lastTestNumber: importedData.sms.testSettings.lastTestNumber ?? prev.testSettings.lastTestNumber,
              lastTestDate: importedData.sms.testSettings.lastTestDate ?? prev.testSettings.lastTestDate,
              lastTestStatus: importedData.sms.testSettings.lastTestStatus ?? prev.testSettings.lastTestStatus,
              lastTestMessage: importedData.sms.testSettings.lastTestMessage ?? prev.testSettings.lastTestMessage
            }
          }))
        }
        
        toast({
          title: "Settings imported",
          description: "Settings have been imported successfully",
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid settings file format",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Configure your POS system preferences and options</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportSettings}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" className="flex items-center" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
          </label>
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="general" className="flex items-center">
            <Store className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="printer" className="flex items-center">
            <Printer className="h-4 w-4 mr-2" />
            Printer
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center">
            <Receipt className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Taxes
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS Gateway
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Store Information
              </CardTitle>
              <CardDescription>
                Configure your store's basic information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={storeSettings.name}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter store name"
                  />
                </div>
                <div>
                  <Label htmlFor="storePhone">Phone Number</Label>
                  <Input
                    id="storePhone"
                    value={storeSettings.phone}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="storeEmail">Email Address</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={storeSettings.email}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={storeSettings.currency} onValueChange={(value) => setStoreSettings(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={storeSettings.timezone} onValueChange={(value) => setStoreSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                      <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                      <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                      <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                      <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                      <SelectItem value="UTC+1">CET (UTC+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    value={storeSettings.taxRate}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter tax rate"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="storeAddress">Store Address</Label>
                <Input
                  id="storeAddress"
                  value={storeSettings.address}
                  onChange={(e) => setStoreSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter store address"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="h-5 w-5 mr-2" />
                Printer Configuration
              </CardTitle>
              <CardDescription>
                Configure receipt and label printer settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receiptPrinter">Receipt Printer</Label>
                  <Select value={printerSettings.receiptPrinter} onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, receiptPrinter: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select receipt printer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Printer</SelectItem>
                      <SelectItem value="thermal">Thermal Printer</SelectItem>
                      <SelectItem value="dot-matrix">Dot Matrix Printer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="labelPrinter">Label Printer</Label>
                  <Select value={printerSettings.labelPrinter} onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, labelPrinter: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select label printer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Printer</SelectItem>
                      <SelectItem value="thermal">Thermal Printer</SelectItem>
                      <SelectItem value="laser">Laser Printer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="printCopies">Number of Copies</Label>
                  <Input
                    id="printCopies"
                    type="number"
                    min="1"
                    max="10"
                    value={printerSettings.printCopies}
                    onChange={(e) => setPrinterSettings(prev => ({ ...prev, printCopies: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoPrint"
                    checked={printerSettings.autoPrint}
                    onCheckedChange={(checked) => setPrinterSettings(prev => ({ ...prev, autoPrint: checked }))}
                  />
                  <Label htmlFor="autoPrint">Auto-print receipts</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="receiptHeader">Receipt Header</Label>
                <Input
                  id="receiptHeader"
                  value={printerSettings.receiptHeader}
                  onChange={(e) => setPrinterSettings(prev => ({ ...prev, receiptHeader: e.target.value }))}
                  placeholder="Enter receipt header text"
                />
              </div>
              <div>
                <Label htmlFor="receiptFooter">Receipt Footer</Label>
                <Input
                  id="receiptFooter"
                  value={printerSettings.receiptFooter}
                  onChange={(e) => setPrinterSettings(prev => ({ ...prev, receiptFooter: e.target.value }))}
                  placeholder="Enter receipt footer text"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceSettingsEditor />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified when items are running low</p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowStockAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, lowStockAlerts: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sales Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified about new sales</p>
                  </div>
                  <Switch
                    checked={notificationSettings.salesNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, salesNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Customer Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified about customer activities</p>
                  </div>
                  <Switch
                    checked={notificationSettings.customerNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, customerNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Employee Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified about employee activities</p>
                  </div>
                  <Switch
                    checked={notificationSettings.employeeNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, employeeNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="120"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="twoFactorAuth"
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                  />
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auditLog"
                    checked={securitySettings.auditLog}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, auditLog: checked }))}
                  />
                  <Label htmlFor="auditLog">Enable Audit Log</Label>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-lg font-medium mb-3">Password Policy</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minLength">Minimum Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      min="6"
                      max="20"
                      value={securitySettings.passwordPolicy.minLength}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        passwordPolicy: { ...prev.passwordPolicy, minLength: parseInt(e.target.value) || 8 }
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireUppercase"
                      checked={securitySettings.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({
                        ...prev,
                        passwordPolicy: { ...prev.passwordPolicy, requireUppercase: checked }
                      }))}
                    />
                    <Label htmlFor="requireUppercase">Require Uppercase Letters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireNumbers"
                      checked={securitySettings.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({
                        ...prev,
                        passwordPolicy: { ...prev.passwordPolicy, requireNumbers: checked }
                      }))}
                    />
                    <Label htmlFor="requireNumbers">Require Numbers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireSpecialChars"
                      checked={securitySettings.passwordPolicy.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({
                        ...prev,
                        passwordPolicy: { ...prev.passwordPolicy, requireSpecialChars: checked }
                      }))}
                    />
                    <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your POS system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={appearanceSettings.theme} onValueChange={(value: 'light' | 'dark' | 'auto') => setAppearanceSettings(prev => ({ ...prev, theme: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Select value={appearanceSettings.fontSize} onValueChange={(value: 'small' | 'medium' | 'large') => setAppearanceSettings(prev => ({ ...prev, fontSize: value }))}>
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
                  <Label htmlFor="language">Language</Label>
                  <Select value={appearanceSettings.language} onValueChange={(value) => setAppearanceSettings(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={appearanceSettings.dateFormat} onValueChange={(value) => setAppearanceSettings(prev => ({ ...prev, dateFormat: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select value={appearanceSettings.timeFormat} onValueChange={(value: '12h' | '24h') => setAppearanceSettings(prev => ({ ...prev, timeFormat: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="navigationLayout">Navigation Layout</Label>
                  <Select value={appearanceSettings.navigationLayout} onValueChange={(value: 'horizontal' | 'vertical') => {
                    setAppearanceSettings(prev => ({ ...prev, navigationLayout: value }))
                    // Apply layout change immediately
                    saveLayoutPreference(value, false) // Don't save to database yet, wait for user to save all settings
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horizontal">Horizontal (Top)</SelectItem>
                      <SelectItem value="vertical">Vertical (Sidebar)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Choose between top navigation or left sidebar</p>
                </div>
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={appearanceSettings.primaryColor}
                      onChange={(e) => setAppearanceSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={appearanceSettings.primaryColor}
                      onChange={(e) => setAppearanceSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure payment methods and processing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cash Payments</Label>
                    <p className="text-sm text-gray-500">Enable cash payment method</p>
                  </div>
                  <Switch
                    checked={paymentSettings.cashEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, cashEnabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Card Payments</Label>
                    <p className="text-sm text-gray-500">Enable card payment method</p>
                  </div>
                  <Switch
                    checked={paymentSettings.cardEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, cardEnabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mobile Payments</Label>
                    <p className="text-sm text-gray-500">Enable mobile payment methods</p>
                  </div>
                  <Switch
                    checked={paymentSettings.mobilePayEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, mobilePayEnabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Tips</Label>
                    <p className="text-sm text-gray-500">Allow customers to add tips</p>
                  </div>
                  <Switch
                    checked={paymentSettings.tipEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, tipEnabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Partial Payments</Label>
                    <p className="text-sm text-gray-500">Allow partial payments</p>
                  </div>
                  <Switch
                    checked={paymentSettings.partialPayments}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, partialPayments: checked }))}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultPaymentMethod">Default Payment Method</Label>
                  <Select value={paymentSettings.defaultPaymentMethod} onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, defaultPaymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {paymentSettings.tipEnabled && (
                <div>
                  <Label>Tip Percentages</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {paymentSettings.tipPercentages.map((percentage, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center">
                        {percentage}%
                        <button
                          onClick={() => {
                            const newPercentages = paymentSettings.tipPercentages.filter((_, i) => i !== index)
                            setPaymentSettings(prev => ({ ...prev, tipPercentages: newPercentages }))
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPercentage = prompt('Enter tip percentage:')
                        if (newPercentage && !isNaN(parseFloat(newPercentage))) {
                          setPaymentSettings(prev => ({
                            ...prev,
                            tipPercentages: [...prev.tipPercentages, parseFloat(newPercentage)]
                          }))
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Tax Settings
              </CardTitle>
              <CardDescription>
                Configure tax rates and rules for your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="taxEnabled"
                    checked={taxSettings.enabled}
                    onCheckedChange={(checked) => setTaxSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="taxEnabled">Enable Taxes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="taxInclusive"
                    checked={taxSettings.inclusive}
                    onCheckedChange={(checked) => setTaxSettings(prev => ({ ...prev, inclusive: checked }))}
                  />
                  <Label htmlFor="taxInclusive">Tax Inclusive Pricing</Label>
                </div>
                <div>
                  <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    step="0.1"
                    value={taxSettings.defaultRate}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, defaultRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium">Tax Rules</h4>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const name = prompt('Enter tax rule name:')
                      const rate = prompt('Enter tax rate (%):')
                      const category = prompt('Enter category:')
                      
                      if (name && rate && category && !isNaN(parseFloat(rate))) {
                        setTaxSettings(prev => ({
                          ...prev,
                          taxRules: [...prev.taxRules, {
                            id: Date.now().toString(),
                            name,
                            rate: parseFloat(rate),
                            category
                          }]
                        }))
                      }
                    }}
                  >
                    Add Rule
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {taxSettings.taxRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-gray-500">{rule.category} - {rule.rate}%</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTaxSettings(prev => ({
                            ...prev,
                            taxRules: prev.taxRules.filter(r => r.id !== rule.id)
                          }))
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                SMS Gateway Configuration
              </CardTitle>
              <CardDescription>
                Configure SMS gateway settings and message triggers for automated notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SMS Enable/Disable */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="smsEnabled"
                  checked={smsSettings.enabled}
                  onCheckedChange={(checked) => setSmsSettings(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="smsEnabled">Enable SMS Service</Label>
              </div>

              <Separator />

              {/* Gateway Configuration */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Gateway Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smsProvider">SMS Provider</Label>
                    <Select 
                      value={smsSettings.gateway.provider} 
                      onValueChange={(value: any) => {
                        const gateway = PREDEFINED_GATEWAYS.find(g => g.id === value)
                        if (gateway) {
                          setSmsSettings(prev => ({
                            ...prev,
                            gateway: {
                              ...prev.gateway,
                              provider: value,
                              apiUrl: gateway.config.apiUrl,
                              httpMethod: gateway.config.httpMethod,
                              messageParam: gateway.config.messageParam,
                              receiverParam: gateway.config.receiverParam,
                              additionalHeaders: JSON.stringify(gateway.config.additionalHeaders || {}),
                              additionalParams: JSON.stringify(gateway.config.additionalParams || {})
                            }
                          }))
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select SMS provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Gateway</SelectItem>
                        {PREDEFINED_GATEWAYS.map(gateway => (
                          <SelectItem key={gateway.id} value={gateway.id}>
                            {gateway.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="httpMethod">HTTP Method</Label>
                    <Select 
                      value={smsSettings.gateway.httpMethod} 
                      onValueChange={(value: 'GET' | 'POST') => setSmsSettings(prev => ({ 
                        ...prev, 
                        gateway: { ...prev.gateway, httpMethod: value } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="apiUrl">API Base URL</Label>
                    <Input
                      id="apiUrl"
                      value={smsSettings.gateway.apiUrl}
                      onChange={(e) => setSmsSettings(prev => ({ 
                        ...prev, 
                        gateway: { ...prev.gateway, apiUrl: e.target.value } 
                      }))}
                      placeholder="https://api.example.com/sms/send"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="apiKey">API Key / Username</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={smsSettings.gateway.apiKey}
                        onChange={(e) => setSmsSettings(prev => ({ 
                          ...prev, 
                          gateway: { ...prev.gateway, apiKey: e.target.value } 
                        }))}
                        placeholder="Enter API key or username"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apiSecret">API Secret / Password</Label>
                      <Input
                        id="apiSecret"
                        type="password"
                        value={smsSettings.gateway.apiSecret}
                        onChange={(e) => setSmsSettings(prev => ({ 
                          ...prev, 
                          gateway: { ...prev.gateway, apiSecret: e.target.value } 
                        }))}
                        placeholder="Enter API secret or password"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="senderId">Sender ID</Label>
                      <Input
                        id="senderId"
                        value={smsSettings.gateway.senderId}
                        onChange={(e) => setSmsSettings(prev => ({ 
                          ...prev, 
                          gateway: { ...prev.gateway, senderId: e.target.value } 
                        }))}
                        placeholder="Your sender ID"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="messageParam">Message Parameter</Label>
                      <Input
                        id="messageParam"
                        value={smsSettings.gateway.messageParam}
                        onChange={(e) => setSmsSettings(prev => ({ 
                          ...prev, 
                          gateway: { ...prev.gateway, messageParam: e.target.value } 
                        }))}
                        placeholder="message"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="receiverParam">Receiver Parameter</Label>
                      <Input
                        id="receiverParam"
                        value={smsSettings.gateway.receiverParam}
                        onChange={(e) => setSmsSettings(prev => ({ 
                          ...prev, 
                          gateway: { ...prev.gateway, receiverParam: e.target.value } 
                        }))}
                        placeholder="to"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="additionalHeaders">Additional Headers (JSON)</Label>
                      <textarea
                        id="additionalHeaders"
                        className="w-full p-2 border rounded-md text-sm font-mono"
                        rows={3}
                        value={smsSettings.gateway.additionalHeaders}
                        onChange={(e) => setSmsSettings(prev => ({ 
                          ...prev, 
                          gateway: { ...prev.gateway, additionalHeaders: e.target.value } 
                        }))}
                        placeholder='{"Content-Type": "application/json"}'
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="additionalParams">Additional Parameters (JSON)</Label>
                      <textarea
                        id="additionalParams"
                        className="w-full p-2 border rounded-md text-sm font-mono"
                        rows={3}
                        value={smsSettings.gateway.additionalParams}
                        onChange={(e) => setSmsSettings(prev => ({ 
                          ...prev, 
                          gateway: { ...prev.gateway, additionalParams: e.target.value } 
                        }))}
                        placeholder='{"priority": "high"}'
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Test SMS */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Test SMS Configuration</h4>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="testNumber">Test Phone Number</Label>
                    <Input
                      id="testNumber"
                      value={smsSettings.testSettings.lastTestNumber || ''}
                      onChange={(e) => setSmsSettings(prev => ({ 
                        ...prev, 
                        testSettings: { ...prev.testSettings, lastTestNumber: e.target.value } 
                      }))}
                      placeholder="+1234567890"
                    />
                  </div>
                  
                  <Button 
                    onClick={async () => {
                      if (!smsSettings.testSettings.lastTestNumber) {
                        toast({
                          title: "Error",
                          description: "Please enter a test phone number",
                          variant: "destructive"
                        })
                        return
                      }

                      try {
                        const response = await fetch('/api/sms/test', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            to: smsSettings.testSettings.lastTestNumber,
                            message: 'This is a test message from POS System'
                          })
                        })

                        const result = await response.json()
                        
                        if (result.success) {
                          toast({
                            title: "Test SMS Sent",
                            description: "Test message sent successfully",
                          })
                          // Reload settings to update test status
                          loadSettings()
                        } else {
                          toast({
                            title: "Test Failed",
                            description: result.error || "Failed to send test SMS",
                            variant: "destructive"
                          })
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to send test SMS",
                          variant: "destructive"
                        })
                      }
                    }}
                    disabled={!smsSettings.enabled || !smsSettings.testSettings.lastTestNumber}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Send Test SMS
                  </Button>
                </div>

                {smsSettings.testSettings.lastTestDate && (
                  <div className="text-sm text-gray-600">
                    Last test: {smsSettings.testSettings.lastTestDate} - 
                    Status: <span className={`font-medium ${smsSettings.testSettings.lastTestStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {smsSettings.testSettings.lastTestStatus}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Message Triggers */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Message Triggers</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* New Sale Trigger */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="newSaleTrigger"
                        checked={smsSettings.triggers.newSale.enabled}
                        onCheckedChange={(checked) => setSmsSettings(prev => ({ 
                          ...prev, 
                          triggers: { 
                            ...prev.triggers, 
                            newSale: { ...prev.triggers.newSale, enabled: checked } 
                          } 
                        }))}
                      />
                      <Label htmlFor="newSaleTrigger">New Sale Confirmation</Label>
                    </div>
                    
                    {smsSettings.triggers.newSale.enabled && (
                      <div className="space-y-2">
                        <Label htmlFor="newSaleTemplate">Message Template</Label>
                        <textarea
                          id="newSaleTemplate"
                          className="w-full p-2 border rounded-md text-sm"
                          rows={3}
                          value={smsSettings.triggers.newSale.template}
                          onChange={(e) => setSmsSettings(prev => ({ 
                            ...prev, 
                            triggers: { 
                              ...prev.triggers, 
                              newSale: { ...prev.triggers.newSale, template: e.target.value } 
                            } 
                          }))}
                        />
                        <div className="text-xs text-gray-500">
                          Available variables: {invoiceId}, {amount}, {storeName}, {customerName}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Due Reminder Trigger */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dueReminderTrigger"
                        checked={smsSettings.triggers.dueReminder.enabled}
                        onCheckedChange={(checked) => setSmsSettings(prev => ({ 
                          ...prev, 
                          triggers: { 
                            ...prev.triggers, 
                            dueReminder: { ...prev.triggers.dueReminder, enabled: checked } 
                          } 
                        }))}
                      />
                      <Label htmlFor="dueReminderTrigger">Due Payment Reminder</Label>
                    </div>
                    
                    {smsSettings.triggers.dueReminder.enabled && (
                      <div className="space-y-2">
                        <Label htmlFor="dueReminderTemplate">Message Template</Label>
                        <textarea
                          id="dueReminderTemplate"
                          className="w-full p-2 border rounded-md text-sm"
                          rows={3}
                          value={smsSettings.triggers.dueReminder.template}
                          onChange={(e) => setSmsSettings(prev => ({ 
                            ...prev, 
                            triggers: { 
                              ...prev.triggers, 
                              dueReminder: { ...prev.triggers.dueReminder, template: e.target.value } 
                            } 
                          }))}
                        />
                        <div className="text-xs text-gray-500">
                          Available variables: {customerName}, {amount}, {dueDate}, {storeName}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Daily Summary Trigger */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dailySummaryTrigger"
                        checked={smsSettings.triggers.dailySalesSummary.enabled}
                        onCheckedChange={(checked) => setSmsSettings(prev => ({ 
                          ...prev, 
                            triggers: { 
                              ...prev.triggers, 
                              dailySalesSummary: { ...prev.triggers.dailySalesSummary, enabled: checked } 
                            } 
                          }))}
                      />
                      <Label htmlFor="dailySummaryTrigger">Daily Sales Summary</Label>
                    </div>
                    
                    {smsSettings.triggers.dailySalesSummary.enabled && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="summaryRecipients">Recipients</Label>
                            <Input
                              id="summaryRecipients"
                              value={smsSettings.triggers.dailySalesSummary.recipients}
                              onChange={(e) => setSmsSettings(prev => ({ 
                                ...prev, 
                                triggers: { 
                                  ...prev.triggers, 
                                  dailySalesSummary: { ...prev.triggers.dailySalesSummary, recipients: e.target.value } 
                                } 
                              }))}
                              placeholder="+1234567890,+0987654321"
                            />
                          </div>
                          <div>
                            <Label htmlFor="summaryTime">Time</Label>
                            <Input
                              id="summaryTime"
                              type="time"
                              value={smsSettings.triggers.dailySalesSummary.time}
                              onChange={(e) => setSmsSettings(prev => ({ 
                                ...prev, 
                                triggers: { 
                                  ...prev.triggers, 
                                  dailySalesSummary: { ...prev.triggers.dailySalesSummary, time: e.target.value } 
                                } 
                              }))}
                            />
                          </div>
                        </div>
                        <Label htmlFor="dailySummaryTemplate">Message Template</Label>
                        <textarea
                          id="dailySummaryTemplate"
                          className="w-full p-2 border rounded-md text-sm"
                          rows={2}
                          value={smsSettings.triggers.dailySalesSummary.template}
                          onChange={(e) => setSmsSettings(prev => ({ 
                            ...prev, 
                            triggers: { 
                              ...prev.triggers, 
                              dailySalesSummary: { ...prev.triggers.dailySalesSummary, template: e.target.value } 
                            } 
                          }))}
                        />
                        <div className="text-xs text-gray-500">
                          Available variables: {date}, {totalSales}, {transactionCount}, {averageTransaction}, {storeName}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OTP Trigger */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="otpTrigger"
                        checked={smsSettings.triggers.otp.enabled}
                        onCheckedChange={(checked) => setSmsSettings(prev => ({ 
                          ...prev, 
                          triggers: { 
                            ...prev.triggers, 
                            otp: { ...prev.triggers.otp, enabled: checked } 
                          } 
                        }))}
                      />
                      <Label htmlFor="otpTrigger">OTP Authentication</Label>
                    </div>
                    
                    {smsSettings.triggers.otp.enabled && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="otpExpiry">Expiry (minutes)</Label>
                            <Input
                              id="otpExpiry"
                              type="number"
                              min="1"
                              max="60"
                              value={smsSettings.triggers.otp.expiryMinutes}
                              onChange={(e) => setSmsSettings(prev => ({ 
                                ...prev, 
                                triggers: { 
                                  ...prev.triggers, 
                                  otp: { ...prev.triggers.otp, expiryMinutes: parseInt(e.target.value) || 5 } 
                                } 
                              }))}
                            />
                          </div>
                        </div>
                        <Label htmlFor="otpTemplate">Message Template</Label>
                        <textarea
                          id="otpTemplate"
                          className="w-full p-2 border rounded-md text-sm"
                          rows={2}
                          value={smsSettings.triggers.otp.template}
                          onChange={(e) => setSmsSettings(prev => ({ 
                            ...prev, 
                            triggers: { 
                              ...prev.triggers, 
                              otp: { ...prev.triggers.otp, template: e.target.value } 
                            } 
                          }))}
                        />
                        <div className="text-xs text-gray-500">
                          Available variables: {otp}, {expiryMinutes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}