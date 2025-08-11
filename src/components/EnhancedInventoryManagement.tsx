"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Plus, 
  Minus,
  Search,
  Filter,
  BarChart3,
  Truck,
  Box,
  Warehouse,
  ShoppingCart,
  DollarSign,
  Calendar,
  Clock,
  Zap,
  Target,
  Settings,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  AlertCircle,
  Info,
  Layers,
  Move3D,
  QrCode,
  Scale,
  Timer
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku?: string
  barcode?: string
  imageUrl?: string
  category?: {
    id: string
    name: string
  }
  stock?: number
  minStock?: number
  maxStock?: number
  reorderPoint?: number
  costPrice?: number
  supplier?: {
    id: string
    name: string
  }
  lastRestock?: string
  nextRestock?: string
  isSerialized?: boolean
  isBatched?: boolean
  hasVariations?: boolean
  status?: 'active' | 'inactive' | 'discontinued'
}

interface InventoryItem {
  id: string
  productId: string
  storeId: string
  quantity: number
  minStock: number
  maxStock: number
  reorderPoint: number
  costPrice: number
  location?: string
  aisle?: string
  shelf?: string
  bin?: string
  batchNumber?: string
  expiryDate?: string
  serialNumber?: string
  isActive: boolean
  lastUpdated: string
  product: Product
  store?: {
    id: string
    name: string
  }
}

interface StockMovement {
  id: string
  productId: string
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  reason: string
  referenceId?: string
  fromStoreId?: string
  toStoreId?: string
  userId: string
  createdAt: string
  product: Product
  user: {
    id: string
    name: string
  }
}

interface ReorderRule {
  id: string
  productId: string
  ruleType: 'quantity' | 'time' | 'demand'
  triggerValue: number
  orderQuantity: number
  supplierId: string
  isActive: boolean
  lastTriggered?: string
  product: Product
  supplier: {
    id: string
    name: string
    contactInfo?: string
  }
}

interface StockAlert {
  id: string
  productId: string
  type: 'low_stock' | 'overstock' | 'expiry' | 'reorder'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  isRead: boolean
  isResolved: boolean
  createdAt: string
  product: Product
}

interface InventoryAnalytics {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  overstockItems: number
  expiringItems: number
  turnoverRate: number
  stockAccuracy: number
  topSelling: Product[]
  slowMoving: Product[]
  categoryPerformance: Array<{
    category: string
    products: number
    totalValue: number
    turnoverRate: number
  }>
}

export default function EnhancedInventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [reorderRules, setReorderRules] = useState<ReorderRule[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [storeFilter, setStoreFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddMovement, setShowAddMovement] = useState(false)
  const [showAddRule, setShowAddRule] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { toast } = useToast()

  // Form states
  const [newMovement, setNewMovement] = useState({
    productId: '',
    type: 'in',
    quantity: 0,
    reason: '',
    referenceId: ''
  })

  const [newRule, setNewRule] = useState({
    productId: '',
    ruleType: 'quantity',
    triggerValue: 0,
    orderQuantity: 0,
    supplierId: ''
  })

  useEffect(() => {
    fetchInventoryData()
    fetchAnalytics()
  }, [])

  const fetchInventoryData = async () => {
    setLoading(true)
    try {
      // Fetch inventory items
      const inventoryResponse = await fetch('/api/inventory')
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        setInventory(inventoryData)
      }

      // Fetch products
      const productsResponse = await fetch('/api/products')
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData)
      }

      // Fetch stock movements
      const movementsResponse = await fetch('/api/stock-movements')
      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json()
        setStockMovements(movementsData)
      }

      // Fetch reorder rules
      const rulesResponse = await fetch('/api/inventory/reorder-rules')
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json()
        setReorderRules(rulesData)
      }

      // Fetch stock alerts
      const alertsResponse = await fetch('/api/inventory-alerts')
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setStockAlerts(alertsData)
      }

    } catch (error) {
      console.error('Error fetching inventory data:', error)
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      // Mock analytics data
      setAnalytics({
        totalProducts: 156,
        totalValue: 45750.00,
        lowStockItems: 12,
        overstockItems: 8,
        expiringItems: 5,
        turnoverRate: 8.2,
        stockAccuracy: 94.5,
        topSelling: products.slice(0, 5),
        slowMoving: products.slice(-5),
        categoryPerformance: [
          { category: 'Beverages', products: 45, totalValue: 12500, turnoverRate: 12.5 },
          { category: 'Food', products: 38, totalValue: 18900, turnoverRate: 9.8 },
          { category: 'Snacks', products: 42, totalValue: 8900, turnoverRate: 15.2 },
          { category: 'Merchandise', products: 31, totalValue: 5450, turnoverRate: 6.3 }
        ]
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const createStockMovement = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMovement),
      })

      if (response.ok) {
        await fetchInventoryData()
        setShowAddMovement(false)
        setNewMovement({
          productId: '',
          type: 'in',
          quantity: 0,
          reason: '',
          referenceId: ''
        })
        toast({
          title: "Success",
          description: "Stock movement recorded successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to record stock movement",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record stock movement",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createReorderRule = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory/reorder-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRule),
      })

      if (response.ok) {
        await fetchInventoryData()
        setShowAddRule(false)
        setNewRule({
          productId: '',
          ruleType: 'quantity',
          triggerValue: 0,
          orderQuantity: 0,
          supplierId: ''
        })
        toast({
          title: "Success",
          description: "Reorder rule created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create reorder rule",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create reorder rule",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory-alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isResolved: true }),
      })

      if (response.ok) {
        await fetchInventoryData()
        toast({
          title: "Success",
          description: "Alert resolved successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive"
      })
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    const stockLevel = item.quantity / item.maxStock
    if (item.quantity <= item.reorderPoint) return { status: 'low', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    if (stockLevel > 1) return { status: 'overstock', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    if (stockLevel >= 0.7) return { status: 'good', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    return { status: 'normal', color: 'bg-blue-100 text-blue-800', icon: Info }
  }

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.barcode?.includes(searchTerm)
    const matchesCategory = categoryFilter === 'all' || item.product.category?.name === categoryFilter
    const matchesStore = storeFilter === 'all' || item.store?.name === storeFilter
    const matchesStatus = statusFilter === 'all' || getStockStatus(item).status === statusFilter
    return matchesSearch && matchesCategory && matchesStore && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Inventory Management</h2>
          <p className="text-gray-600">Advanced stock control with analytics and automation</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAddMovement(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Stock Movement
          </Button>
          <Button onClick={() => setShowAddRule(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Reorder Rule
          </Button>
          <Button onClick={fetchInventoryData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{analytics.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">{formatPrice(analytics.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold">{analytics.lowStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Box className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overstock</p>
                  <p className="text-2xl font-bold">{analytics.overstockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Timer className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold">{analytics.expiringItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Turnover Rate</p>
                  <p className="text-2xl font-bold">{analytics.turnoverRate}x</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="rules">Reorder Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Snacks">Snacks</SelectItem>
                    <SelectItem value="Merchandise">Merchandise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    <SelectItem value="Main Store">Main Store</SelectItem>
                    <SelectItem value="Downtown">Downtown</SelectItem>
                    <SelectItem value="Mall Branch">Mall Branch</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="overstock">Overstock</SelectItem>
                    <SelectItem value="good">Good Stock</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredInventory.map((item) => {
              const stockStatus = getStockStatus(item)
              const stockPercentage = (item.quantity / item.maxStock) * 100
              
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.product.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{item.product.sku}</Badge>
                          <Badge className={stockStatus.color}>
                            <stockStatus.icon className="h-3 w-3 mr-1" />
                            {stockStatus.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.product.price)}</p>
                        <p className="text-sm text-gray-600">{item.quantity} in stock</p>
                      </div>
                    </div>
                    
                    {/* Stock Level Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Stock Level</span>
                        <span>{Math.round(stockPercentage)}%</span>
                      </div>
                      <Progress 
                        value={stockPercentage} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Min: {item.minStock}</span>
                        <span>Max: {item.maxStock}</span>
                      </div>
                    </div>
                    
                    {/* Location Info */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {item.location && (
                        <div className="flex items-center">
                          <Warehouse className="h-3 w-3 mr-2" />
                          {item.location}
                        </div>
                      )}
                      {item.aisel && (
                        <div className="flex items-center">
                          <Layers className="h-3 w-3 mr-2" />
                          Aisle {item.aisel}, Shelf {item.shelf || 'N/A'}
                        </div>
                      )}
                      {item.batchNumber && (
                        <div className="flex items-center">
                          <Scale className="h-3 w-3 mr-2" />
                          Batch: {item.batchNumber}
                        </div>
                      )}
                      {item.expiryDate && (
                        <div className="flex items-center">
                          <Timer className="h-3 w-3 mr-2" />
                          Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <QrCode className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {stockMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          movement.type === 'in' ? 'bg-green-100' : 
                          movement.type === 'out' ? 'bg-red-100' : 
                          'bg-blue-100'
                        }`}>
                          {movement.type === 'in' ? <Plus className="h-4 w-4 text-green-600" /> :
                           movement.type === 'out' ? <Minus className="h-4 w-4 text-red-600" /> :
                           <Move3D className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{movement.product.name}</p>
                          <p className="text-sm text-gray-600">{movement.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          movement.type === 'in' ? 'text-green-600' : 
                          movement.type === 'out' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}{movement.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">by {movement.user.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stockAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge className={getAlertSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
                    </div>
                    {!alert.isResolved && (
                      <Button 
                        size="sm" 
                        onClick={() => resolveAlert(alert.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">{alert.product.name}</h3>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                      {alert.isResolved ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reorderRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{rule.product.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{rule.ruleType}</Badge>
                        {rule.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => {
                        // Update rule status
                        toast({
                          title: "Rule Updated",
                          description: `Rule ${checked ? 'activated' : 'deactivated'}`,
                        })
                      }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Trigger</span>
                      <span className="font-medium">
                        {rule.ruleType === 'quantity' ? `When stock ≤ ${rule.triggerValue}` :
                         rule.ruleType === 'time' ? `Every ${rule.triggerValue} days` :
                         `Based on demand forecast`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Order Quantity</span>
                      <span className="font-medium">{rule.orderQuantity} units</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Supplier</span>
                      <span className="font-medium">{rule.supplier.name}</span>
                    </div>
                    
                    {rule.lastTriggered && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Triggered</span>
                        <span className="text-sm">
                          {new Date(rule.lastTriggered).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.categoryPerformance.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-sm text-gray-600">
                            {category.products} products • {formatPrice(category.totalValue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Turnover Rate</span>
                          <span className="font-semibold">{category.turnoverRate}x</span>
                        </div>
                        <Progress value={category.turnoverRate * 5} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Top Selling Products</h4>
                      <div className="space-y-2">
                        {analytics.topSelling.map((product, index) => (
                          <div key={product.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">#{index + 1}</span>
                              <span className="text-sm">{product.name}</span>
                            </div>
                            <Badge variant="outline">{formatPrice(product.price)}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Slow Moving Products</h4>
                      <div className="space-y-2">
                        {analytics.slowMoving.map((product, index) => (
                          <div key={product.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">#{index + 1}</span>
                              <span className="text-sm">{product.name}</span>
                            </div>
                            <Badge variant="outline">{formatPrice(product.price)}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Stock Movement Dialog */}
      {showAddMovement && (
        <Dialog open={showAddMovement} onOpenChange={setShowAddMovement}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Stock Movement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="productSelect">Product</Label>
                <Select value={newMovement.productId} onValueChange={(value) => setNewMovement({...newMovement, productId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="movementType">Type</Label>
                  <Select value={newMovement.type} onValueChange={(value) => setNewMovement({...newMovement, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In</SelectItem>
                      <SelectItem value="out">Stock Out</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newMovement.quantity}
                    onChange={(e) => setNewMovement({...newMovement, quantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={newMovement.reason}
                  onChange={(e) => setNewMovement({...newMovement, reason: e.target.value})}
                  placeholder="Enter reason for stock movement..."
                />
              </div>
              
              <div>
                <Label htmlFor="reference">Reference ID (Optional)</Label>
                <Input
                  id="reference"
                  value={newMovement.referenceId}
                  onChange={(e) => setNewMovement({...newMovement, referenceId: e.target.value})}
                  placeholder="Purchase order, invoice number, etc."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddMovement(false)}>
                  Cancel
                </Button>
                <Button onClick={createStockMovement} disabled={loading}>
                  Record Movement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Reorder Rule Dialog */}
      {showAddRule && (
        <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Reorder Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ruleProduct">Product</Label>
                <Select value={newRule.productId} onValueChange={(value) => setNewRule({...newRule, productId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ruleType">Rule Type</Label>
                  <Select value={newRule.ruleType} onValueChange={(value) => setNewRule({...newRule, ruleType: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quantity">Quantity Based</SelectItem>
                      <SelectItem value="time">Time Based</SelectItem>
                      <SelectItem value="demand">Demand Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="triggerValue">Trigger Value</Label>
                  <Input
                    id="triggerValue"
                    type="number"
                    value={newRule.triggerValue}
                    onChange={(e) => setNewRule({...newRule, triggerValue: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="orderQuantity">Order Quantity</Label>
                <Input
                  id="orderQuantity"
                  type="number"
                  value={newRule.orderQuantity}
                  onChange={(e) => setNewRule({...newRule, orderQuantity: parseInt(e.target.value)})}
                />
              </div>
              
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={newRule.supplierId} onValueChange={(value) => setNewRule({...newRule, supplierId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Beverage Supplier Co.</SelectItem>
                    <SelectItem value="2">Food Distributors Ltd.</SelectItem>
                    <SelectItem value="3">Snack Wholesale Inc.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddRule(false)}>
                  Cancel
                </Button>
                <Button onClick={createReorderRule} disabled={loading}>
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}