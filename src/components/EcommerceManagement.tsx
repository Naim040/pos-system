"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { 
  Store, 
  Plus, 
  RefreshCw, 
  Settings, 
  Package, 
  ShoppingCart, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  Activity,
  Database,
  Webhook
} from 'lucide-react'
import EcommerceOrderManagement from './EcommerceOrderManagement'
import EcommerceInventoryManagement from './EcommerceInventoryManagement'
import EcommerceSettings from './EcommerceSettings'
import { PREDEFINED_PLATFORMS, type EcommercePlatform, type EcommerceStore, type EcommerceSyncLog } from '@/types/ecommerce'

interface EcommerceStoreWithDetails extends EcommerceStore {
  platform?: EcommercePlatform
  productCount?: number
  orderCount?: number
  lastSyncLog?: EcommerceSyncLog
}

export default function EcommerceManagement() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('stores')
  const [stores, setStores] = useState<EcommerceStoreWithDetails[]>([])
  const [platforms, setPlatforms] = useState<EcommercePlatform[]>(PREDEFINED_PLATFORMS)
  const [loading, setLoading] = useState(false)
  const [showAddStore, setShowAddStore] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')
  const [newStore, setNewStore] = useState({
    name: '',
    storeUrl: '',
    apiKey: '',
    apiSecret: '',
    config: {} as Record<string, any>
  })

  useEffect(() => {
    fetchStores()
    fetchPlatforms()
  }, [])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/ecommerce/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data)
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
      toast({
        title: "Error",
        description: "Failed to load e-commerce stores",
        variant: "destructive"
      })
    }
  }

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/ecommerce/platforms')
      if (response.ok) {
        const data = await response.json()
        setPlatforms(data)
      }
    } catch (error) {
      console.error('Error fetching platforms:', error)
      // Use predefined platforms as fallback
      setPlatforms(PREDEFINED_PLATFORMS)
    }
  }

  const handleAddStore = async () => {
    if (!selectedPlatform || !newStore.name || !newStore.storeUrl || !newStore.apiKey) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ecommerce/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newStore,
          platformId: selectedPlatform,
          config: newStore.config
        }),
      })

      if (response.ok) {
        const store = await response.json()
        setStores(prev => [...prev, store])
        setShowAddStore(false)
        setNewStore({
          name: '',
          storeUrl: '',
          apiKey: '',
          apiSecret: '',
          config: {}
        })
        setSelectedPlatform('')
        toast({
          title: "Success",
          description: "E-commerce store added successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add store')
      }
    } catch (error) {
      console.error('Error adding store:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add store",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async (storeId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ecommerce/stores/${storeId}/test`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to the e-commerce store",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Connection failed')
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to store",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncStore = async (storeId: string, type: 'products' | 'orders' | 'inventory' | 'full') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ecommerce/stores/${storeId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      if (response.ok) {
        toast({
          title: "Sync Started",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} synchronization has been started`,
        })
        // Refresh stores to get updated sync status
        setTimeout(fetchStores, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Sync failed')
      }
    } catch (error) {
      console.error('Error syncing store:', error)
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync store",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/ecommerce/stores/${storeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setStores(prev => prev.filter(store => store.id !== storeId))
        toast({
          title: "Success",
          description: "E-commerce store deleted successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete store')
      }
    } catch (error) {
      console.error('Error deleting store:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete store",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Idle</Badge>
    }
  }

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const selectedPlatformConfig = platforms.find(p => p.id === selectedPlatform)
  
  // Ensure configTemplate is always an array
  const safeConfigTemplate = selectedPlatformConfig?.configTemplate || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-commerce Integration</h1>
          <p className="text-muted-foreground">
            Manage your e-commerce platform integrations and synchronize data
          </p>
        </div>
        <Button 
          onClick={() => setShowAddStore(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Store
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Stores
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          {showAddStore && (
            <Card>
              <CardHeader>
                <CardTitle>Add New E-commerce Store</CardTitle>
                <CardDescription>
                  Connect your e-commerce platform to synchronize products and orders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select e-commerce platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map(platform => (
                          <SelectItem key={platform.id} value={platform.id}>
                            {platform.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      placeholder="My Online Store"
                      value={newStore.name}
                      onChange={(e) => setNewStore(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeUrl">Store URL</Label>
                    <Input
                      id="storeUrl"
                      placeholder="https://your-store.com"
                      value={newStore.storeUrl}
                      onChange={(e) => setNewStore(prev => ({ ...prev, storeUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter API key"
                      value={newStore.apiKey}
                      onChange={(e) => setNewStore(prev => ({ ...prev, apiKey: e.target.value }))}
                    />
                  </div>
                  {safeConfigTemplate.some(t => t.key === 'apiSecret') && (
                    <div className="space-y-2">
                      <Label htmlFor="apiSecret">API Secret</Label>
                      <Input
                        id="apiSecret"
                        type="password"
                        placeholder="Enter API secret"
                        value={newStore.apiSecret}
                        onChange={(e) => setNewStore(prev => ({ ...prev, apiSecret: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
                
                {selectedPlatformConfig && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Platform Configuration</h4>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {selectedPlatformConfig.description}
                      </AlertDescription>
                    </Alert>
                    {safeConfigTemplate
                      .filter(t => !['apiKey', 'apiSecret'].includes(t.key))
                      .map(config => (
                        <div key={config.key} className="space-y-2">
                          <Label htmlFor={config.key}>{config.label}</Label>
                          {config.type === 'select' ? (
                            <Select onValueChange={(value) => 
                              setNewStore(prev => ({ 
                                ...prev, 
                                config: { ...prev.config, [config.key]: value }
                              }))
                            }>
                              <SelectTrigger>
                                <SelectValue placeholder={config.placeholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {config.options?.map(option => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={config.key}
                              type={config.type === 'password' ? 'password' : 'text'}
                              placeholder={config.placeholder}
                              onChange={(e) => 
                                setNewStore(prev => ({ 
                                  ...prev, 
                                  config: { ...prev.config, [config.key]: e.target.value }
                                }))
                              }
                            />
                          )}
                          {config.description && (
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={handleAddStore} disabled={loading}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Store
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddStore(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map(store => (
              <Card key={store.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                    {getStatusBadge(store.isActive ? 'active' : 'inactive')}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span>{store.platformName}</span>
                    <ExternalLink className="h-3 w-3" />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">URL:</span>
                      <span className="font-medium truncate">{store.storeUrl}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Products:</span>
                      <span className="font-medium">{store.productCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Orders:</span>
                      <span className="font-medium">{store.orderCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sync Status:</span>
                      <div className="flex items-center gap-2">
                        {getSyncStatusIcon(store.syncStatus)}
                        <span className="font-medium">{store.syncStatus}</span>
                      </div>
                    </div>
                    {store.lastSyncAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync:</span>
                        <span className="font-medium">
                          {new Date(store.lastSyncAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {store.syncError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {store.syncError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(store.id)}
                      disabled={loading}
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncStore(store.id, 'products')}
                      disabled={loading}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Sync Products
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncStore(store.id, 'orders')}
                      disabled={loading}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Sync Orders
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncStore(store.id, 'full')}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Full Sync
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteStore(store.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {stores.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No E-commerce Stores</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Connect your e-commerce platforms to start synchronizing products and orders
                </p>
                <Button onClick={() => setShowAddStore(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Store
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <EcommerceInventoryManagement />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <EcommerceOrderManagement />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <EcommerceSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}