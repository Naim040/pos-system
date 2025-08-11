"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Globe, 
  Database, 
  Bell, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Webhook,
  Clock,
  Zap
} from 'lucide-react'

interface EcommerceSettings {
  autoSync: {
    enabled: boolean
    interval: number // minutes
    realTimeUpdates: boolean
  }
  inventory: {
    syncOnSale: boolean
    syncOnPurchase: boolean
    lowStockThreshold: number
    backorderHandling: 'allow' | 'prevent' | 'notify'
  }
  orders: {
    autoImport: boolean
    autoFulfill: boolean
    defaultStatus: string
    customerSync: boolean
  }
  notifications: {
    enabled: boolean
    syncErrors: boolean
    lowStock: boolean
    newOrders: boolean
    email: string
  }
  webhooks: {
    enabled: boolean
    secret: string
    endpoints: string[]
  }
  advanced: {
    debugMode: boolean
    requestTimeout: number // seconds
    retryAttempts: number
    batchSize: number
  }
}

export default function EcommerceSettings() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<EcommerceSettings>({
    autoSync: {
      enabled: true,
      interval: 30,
      realTimeUpdates: true
    },
    inventory: {
      syncOnSale: true,
      syncOnPurchase: true,
      lowStockThreshold: 10,
      backorderHandling: 'notify'
    },
    orders: {
      autoImport: true,
      autoFulfill: false,
      defaultStatus: 'processing',
      customerSync: true
    },
    notifications: {
      enabled: true,
      syncErrors: true,
      lowStock: true,
      newOrders: true,
      email: ''
    },
    webhooks: {
      enabled: false,
      secret: '',
      endpoints: []
    },
    advanced: {
      debugMode: false,
      requestTimeout: 30,
      retryAttempts: 3,
      batchSize: 50
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.ecommerce) {
          setSettings(data.ecommerce)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ecommerce: settings
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "E-commerce settings saved successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ecommerce/settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Test Results",
          description: result.message || "Settings test completed",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Test failed')
      }
    } catch (error) {
      console.error('Error testing settings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (path: string[], value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      let current: any = newSettings
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }
      
      current[path[path.length - 1]] = value
      return newSettings
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-commerce Settings</h1>
          <p className="text-muted-foreground">
            Configure global e-commerce integration settings and synchronization options
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTestSettings} disabled={loading} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Test Settings
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Auto Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Automatic Synchronization
          </CardTitle>
          <CardDescription>
            Configure how and when data is synchronized between your POS and e-commerce platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically synchronize data between platforms
                  </p>
                </div>
                <Switch
                  checked={settings.autoSync.enabled}
                  onCheckedChange={(checked) => updateSetting(['autoSync', 'enabled'], checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
                <Input
                  id="syncInterval"
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.autoSync.interval}
                  onChange={(e) => updateSetting(['autoSync', 'interval'], parseInt(e.target.value) || 30)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Real-time Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync immediately when data changes
                  </p>
                </div>
                <Switch
                  checked={settings.autoSync.realTimeUpdates}
                  onCheckedChange={(checked) => updateSetting(['autoSync', 'realTimeUpdates'], checked)}
                />
              </div>
              
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Real-time updates may increase API usage. Consider your platform's rate limits.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Inventory Management
          </CardTitle>
          <CardDescription>
            Configure how inventory levels are synchronized and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync on Sale</Label>
                  <p className="text-sm text-muted-foreground">
                    Update e-commerce inventory when items are sold in POS
                  </p>
                </div>
                <Switch
                  checked={settings.inventory.syncOnSale}
                  onCheckedChange={(checked) => updateSetting(['inventory', 'syncOnSale'], checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync on Purchase</Label>
                  <p className="text-sm text-muted-foreground">
                    Update POS inventory when items are purchased online
                  </p>
                </div>
                <Switch
                  checked={settings.inventory.syncOnPurchase}
                  onCheckedChange={(checked) => updateSetting(['inventory', 'syncOnPurchase'], checked)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={settings.inventory.lowStockThreshold}
                  onChange={(e) => updateSetting(['inventory', 'lowStockThreshold'], parseInt(e.target.value) || 10)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backorderHandling">Backorder Handling</Label>
                <select
                  id="backorderHandling"
                  className="w-full p-2 border rounded-md"
                  value={settings.inventory.backorderHandling}
                  onChange={(e) => updateSetting(['inventory', 'backorderHandling'], e.target.value)}
                >
                  <option value="allow">Allow Backorders</option>
                  <option value="prevent">Prevent Backorders</option>
                  <option value="notify">Notify on Backorder</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Order Management
          </CardTitle>
          <CardDescription>
            Configure how e-commerce orders are handled and imported
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Import Orders</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically import new e-commerce orders
                  </p>
                </div>
                <Switch
                  checked={settings.orders.autoImport}
                  onCheckedChange={(checked) => updateSetting(['orders', 'autoImport'], checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Fulfill Orders</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically fulfill orders when inventory is available
                  </p>
                </div>
                <Switch
                  checked={settings.orders.autoFulfill}
                  onCheckedChange={(checked) => updateSetting(['orders', 'autoFulfill'], checked)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultStatus">Default Order Status</Label>
                <select
                  id="defaultStatus"
                  className="w-full p-2 border rounded-md"
                  value={settings.orders.defaultStatus}
                  onChange={(e) => updateSetting(['orders', 'defaultStatus'], e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Customer Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync customer data with e-commerce platforms
                  </p>
                </div>
                <Switch
                  checked={settings.orders.customerSync}
                  onCheckedChange={(checked) => updateSetting(['orders', 'customerSync'], checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure email notifications for e-commerce events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for important events
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) => updateSetting(['notifications', 'enabled'], checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={settings.notifications.email}
                  onChange={(e) => updateSetting(['notifications', 'email'], e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync Error Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when synchronization fails
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.syncErrors}
                  onCheckedChange={(checked) => updateSetting(['notifications', 'syncErrors'], checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when inventory is running low
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.lowStock}
                  onCheckedChange={(checked) => updateSetting(['notifications', 'lowStock'], checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Order Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when new orders are received
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.newOrders}
                  onCheckedChange={(checked) => updateSetting(['notifications', 'newOrders'], checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
          <CardDescription>
            Advanced configuration options for developers and administrators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed logging for troubleshooting
                  </p>
                </div>
                <Switch
                  checked={settings.advanced.debugMode}
                  onCheckedChange={(checked) => updateSetting(['advanced', 'debugMode'], checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requestTimeout">Request Timeout (seconds)</Label>
                <Input
                  id="requestTimeout"
                  type="number"
                  min="5"
                  max="300"
                  value={settings.advanced.requestTimeout}
                  onChange={(e) => updateSetting(['advanced', 'requestTimeout'], parseInt(e.target.value) || 30)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retryAttempts">Retry Attempts</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  min="0"
                  max="10"
                  value={settings.advanced.retryAttempts}
                  onChange={(e) => updateSetting(['advanced', 'retryAttempts'], parseInt(e.target.value) || 3)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.advanced.batchSize}
                  onChange={(e) => updateSetting(['advanced', 'batchSize'], parseInt(e.target.value) || 50)}
                />
              </div>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Changing advanced settings may affect system performance. Only modify these if you understand the implications.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}