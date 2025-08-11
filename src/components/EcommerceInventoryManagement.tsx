"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { formatPrice } from '@/lib/currency'
import { 
  Package, 
  RefreshCw, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Database
} from 'lucide-react'

interface InventorySyncRule {
  id: string
  name: string
  storeName: string
  productName: string
  currentStock: number
  ecommerceStock: number
  difference: number
  lastSync: Date
  autoSync: boolean
  status: 'synced' | 'out_of_sync' | 'error'
}

interface InventorySummary {
  totalProducts: number
  syncedProducts: number
  outOfSyncProducts: number
  errorProducts: number
  totalValue: number
}

export default function EcommerceInventoryManagement() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [syncRules, setSyncRules] = useState<InventorySyncRule[]>([])
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [syncInterval, setSyncInterval] = useState(30) // minutes
  const [configuringRule, setConfiguringRule] = useState<InventorySyncRule | null>(null)

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    setLoading(true)
    try {
      // This would fetch from your API
      // For now, we'll use mock data
      const mockSyncRules: InventorySyncRule[] = [
        {
          id: '1',
          name: 'Coffee Beans',
          storeName: 'Shopify Store',
          productName: 'Premium Coffee Beans',
          currentStock: 50,
          ecommerceStock: 45,
          difference: -5,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
          autoSync: true,
          status: 'out_of_sync'
        },
        {
          id: '2',
          name: 'T-Shirt',
          storeName: 'Shopify Store',
          productName: 'Cotton T-Shirt',
          currentStock: 100,
          ecommerceStock: 100,
          difference: 0,
          lastSync: new Date(Date.now() - 30 * 60 * 1000),
          autoSync: true,
          status: 'synced'
        },
        {
          id: '3',
          name: 'Water Bottle',
          storeName: 'WooCommerce Store',
          productName: 'Stainless Steel Bottle',
          currentStock: 25,
          ecommerceStock: 30,
          difference: 5,
          lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
          autoSync: false,
          status: 'out_of_sync'
        }
      ]

      const mockSummary: InventorySummary = {
        totalProducts: 150,
        syncedProducts: 120,
        outOfSyncProducts: 25,
        errorProducts: 5,
        totalValue: 15000
      }

      setSyncRules(mockSyncRules)
      setSummary(mockSummary)
    } catch (error) {
      console.error('Error fetching inventory data:', error)
      toast({
        title: "Error",
        description: "Failed to load inventory synchronization data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncProduct = async (ruleId: string) => {
    setLoading(true)
    try {
      // This would call your sync API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setSyncRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { 
              ...rule, 
              status: 'synced' as const,
              difference: 0,
              lastSync: new Date()
            }
          : rule
      ))
      
      toast({
        title: "Success",
        description: "Product inventory synchronized successfully",
      })
    } catch (error) {
      console.error('Error syncing product:', error)
      toast({
        title: "Error",
        description: "Failed to synchronize product inventory",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    setLoading(true)
    try {
      // This would call your bulk sync API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      setSyncRules(prev => prev.map(rule => ({
        ...rule,
        status: 'synced' as const,
        difference: 0,
        lastSync: new Date()
      })))
      
      toast({
        title: "Success",
        description: "All product inventories synchronized successfully",
      })
    } catch (error) {
      console.error('Error syncing all products:', error)
      toast({
        title: "Error",
        description: "Failed to synchronize all product inventories",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAutoSync = async (ruleId: string, enabled: boolean) => {
    try {
      setSyncRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, autoSync: enabled } : rule
      ))
      
      toast({
        title: "Success",
        description: `Auto-sync ${enabled ? 'enabled' : 'disabled'} for product`,
      })
    } catch (error) {
      console.error('Error toggling auto-sync:', error)
      toast({
        title: "Error",
        description: "Failed to update auto-sync setting",
        variant: "destructive"
      })
    }
  }

  const handleConfigureRule = (rule: InventorySyncRule) => {
    setConfiguringRule(rule)
  }

  const handleSaveConfiguration = async () => {
    if (!configuringRule) return

    setLoading(true)
    try {
      // This would save the configuration to your API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setSyncRules(prev => prev.map(rule => 
        rule.id === configuringRule.id ? configuringRule : rule
      ))
      
      setConfiguringRule(null)
      toast({
        title: "Success",
        description: "Sync rule configuration saved successfully",
      })
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast({
        title: "Error",
        description: "Failed to save sync rule configuration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateRuleConfig = (field: string, value: any) => {
    if (configuringRule) {
      setConfiguringRule(prev => prev ? { ...prev, [field]: value } : null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-100 text-green-800">Synced</Badge>
      case 'out_of_sync':
        return <Badge className="bg-yellow-100 text-yellow-800">Out of Sync</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getDifferenceIcon = (difference: number) => {
    if (difference > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (difference < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    } else {
      return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Synchronization</h1>
          <p className="text-muted-foreground">
            Manage and synchronize inventory levels between your POS and e-commerce platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSyncAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Synced</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.syncedProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Sync</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.outOfSyncProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <Activity className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.errorProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(summary.totalValue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>
            Configure automatic inventory synchronization settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-sync Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync inventory changes
                  </p>
                </div>
                <Switch
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
                <Input
                  id="syncInterval"
                  type="number"
                  min="1"
                  max="1440"
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(parseInt(e.target.value) || 30)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Real-time Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync immediately when inventory changes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when stock is running low
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Sync Rules</CardTitle>
          <CardDescription>
            Manage synchronization rules for individual products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {syncRules.map(rule => (
                <Card key={rule.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription>
                          {rule.storeName} • {rule.productName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(rule.status)}
                        <Switch
                          checked={rule.autoSync}
                          onCheckedChange={(checked) => handleToggleAutoSync(rule.id, checked)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">POS Stock</Label>
                        <p className="text-lg font-semibold">{rule.currentStock}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">E-commerce Stock</Label>
                        <p className="text-lg font-semibold">{rule.ecommerceStock}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Difference</Label>
                        <div className="flex items-center gap-1">
                          {getDifferenceIcon(rule.difference)}
                          <p className={`text-lg font-semibold ${
                            rule.difference > 0 ? 'text-green-600' : 
                            rule.difference < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {rule.difference > 0 ? '+' : ''}{rule.difference}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Sync</Label>
                        <p className="text-sm">
                          {rule.lastSync.toLocaleDateString()} {rule.lastSync.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    {rule.status === 'out_of_sync' && (
                      <Alert className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Inventory levels are out of sync. Click sync to update.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleSyncProduct(rule.id)}
                        disabled={loading || rule.status === 'synced'}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync Now
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleConfigureRule(rule)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {syncRules.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Sync Rules</h3>
                <p className="text-muted-foreground">
                  Configure inventory synchronization rules for your products
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={!!configuringRule} onOpenChange={(open) => !open && setConfiguringRule(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Sync Rule</DialogTitle>
            <DialogDescription>
              Configure synchronization settings for {configuringRule?.name}
            </DialogDescription>
          </DialogHeader>
          {configuringRule && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rule-name" className="text-right">
                  Rule Name
                </Label>
                <Input
                  id="rule-name"
                  value={configuringRule.name}
                  onChange={(e) => updateRuleConfig('name', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sync-threshold" className="text-right">
                  Sync Threshold
                </Label>
                <Input
                  id="sync-threshold"
                  type="number"
                  value="5"
                  className="col-span-3"
                  placeholder="Minimum difference to trigger sync"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sync-direction" className="text-right">
                  Sync Direction
                </Label>
                <Select defaultValue="bidirectional">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pos-to-ecommerce">POS → E-commerce</SelectItem>
                    <SelectItem value="ecommerce-to-pos">E-commerce → POS</SelectItem>
                    <SelectItem value="bidirectional">Bidirectional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync when changes are detected
                  </p>
                </div>
                <Switch
                  checked={configuringRule.autoSync}
                  onCheckedChange={(checked) => updateRuleConfig('autoSync', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when stock is running low
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfiguringRule(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfiguration} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}