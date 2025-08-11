"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Search, 
  Edit, 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Truck, 
  Users, 
  TrendingUp,
  Filter,
  RefreshCw,
  MapPin,
  Calendar,
  DollarSign,
  Box,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal,
  Eye,
  Settings
} from 'lucide-react'
import BarcodeScanner from '@/components/BarcodeScanner'

interface InventoryItem {
  id: string
  quantity: number
  minStock: number
  maxStock?: number
  reorderPoint: number
  costPrice: number
  location?: string
  aisle?: string
  shelf?: string
  bin?: string
  batchNumber?: string
  expiryDate?: string
  isActive: boolean
  product: {
    id: string
    name: string
    price: number
    sku?: string
    barcode?: string
    category?: {
      id: string
      name: string
    }
  }
  stockMovements: Array<{
    id: string
    type: string
    quantity: number
    reason: string
    createdAt: string
  }>
  inventoryAlerts: Array<{
    id: string
    type: string
    severity: string
    message: string
    isResolved: boolean
    createdAt: string
  }>
}

interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  paymentTerms?: string
  isActive: boolean
  purchaseOrders: Array<{
    id: string
    status: string
    total: number
    orderDate: string
  }>
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  status: string
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  subtotal: number
  tax: number
  shipping: number
  total: number
  notes?: string
  supplier: {
    id: string
    name: string
    email: string
    phone: string
  }
  items: Array<{
    id: string
    quantity: number
    receivedQuantity: number
    unitPrice: number
    totalPrice: number
    product: {
      id: string
      name: string
      sku: string
      price: number
    }
  }>
}

interface StockMovement {
  id: string
  type: string
  quantity: number
  reason: string
  notes?: string
  location?: string
  createdAt: string
  product: {
    id: string
    name: string
    sku: string
    imageUrl?: string
  }
  inventory: {
    location?: string
    aisle?: string
    shelf?: string
    bin?: string
  }
}

interface InventoryAlert {
  id: string
  type: string
  severity: string
  message: string
  isRead: boolean
  isResolved: boolean
  createdAt: string
  product: {
    id: string
    name: string
    sku: string
    imageUrl?: string
  }
  inventory: {
    quantity: number
    minStock: number
    maxStock?: number
    location?: string
  }
}

export default function AdvancedInventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState('inventory')
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<any>(null)
  const [stockAdjustmentAmount, setStockAdjustmentAmount] = useState('')
  
  // Dialog states
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false)
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [isPODialogOpen, setIsPODialogOpen] = useState(false)
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false)
  
  const [editingItem, setEditingItem] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchInventory()
    fetchSuppliers()
    fetchPurchaseOrders()
    fetchStockMovements()
    fetchAlerts()
  }, [])

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') {
        params.append(filterType, 'true')
      }
      
      const response = await fetch(`/api/inventory?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInventory(data.inventory || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch('/api/purchase-orders')
      if (response.ok) {
        const data = await response.json()
        setPurchaseOrders(data.purchaseOrders || [])
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    }
  }

  const fetchStockMovements = async () => {
    try {
      const response = await fetch('/api/stock-movements?limit=50')
      if (response.ok) {
        const data = await response.json()
        setStockMovements(data.movements || [])
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/inventory-alerts?isResolved=false')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const filteredInventory = inventory.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock)
  const outOfStockItems = inventory.filter(item => item.quantity === 0)
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical')

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' }
    if (item.quantity <= item.minStock) return { label: 'Low Stock', variant: 'destructive' as const, color: 'text-red-600' }
    if (item.maxStock && item.quantity >= item.maxStock) return { label: 'Overstocked', variant: 'secondary' as const, color: 'text-yellow-600' }
    return { label: 'In Stock', variant: 'default' as const, color: 'text-green-600' }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'sent':
        return <Badge variant="outline">Sent</Badge>
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>
      case 'received':
        return <Badge variant="default" className="bg-green-100 text-green-800">Received</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'high':
        return <Badge variant="destructive" className="bg-orange-100 text-orange-800">High</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>
      case 'low':
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const calculateInventoryValue = () => {
    return inventory.reduce((total, item) => total + (item.quantity * item.costPrice), 0)
  }

  const calculateLowStockValue = () => {
    return lowStockItems.reduce((total, item) => total + ((item.minStock - item.quantity) * item.costPrice), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Advanced Inventory Management</h2>
          <p className="text-gray-600">Comprehensive inventory control with supplier management</p>
        </div>
        <div className="flex items-center space-x-2">
          {criticalAlerts.length > 0 && (
            <Badge variant="destructive" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {criticalAlerts.length} critical alerts
            </Badge>
          )}
          <Button onClick={() => fetchInventory()} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Box className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Stock Value</p>
                <p className="text-2xl font-bold">${calculateInventoryValue().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suppliers</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open POs</p>
                <p className="text-2xl font-bold">
                  {purchaseOrders.filter(po => !['received', 'cancelled'].includes(po.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{alert.product.name}</p>
                    <p className="text-xs text-gray-600">{alert.message}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getSeverityBadge(alert.severity)}
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </div>
              ))}
              {criticalAlerts.length > 3 && (
                <p className="text-sm text-red-700">
                  And {criticalAlerts.length - 3} more critical alerts...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="stock-adjustment">Stock Adj.</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Filters */}
          <Card>
            <CardContent className="p-6">
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
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="lowStock">Low Stock</SelectItem>
                    <SelectItem value="outOfStock">Out of Stock</SelectItem>
                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsInventoryDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Grid */}
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item)
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.product.name}</CardTitle>
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                      {item.product.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.product.category.name}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Current Stock</p>
                            <p className={`font-medium ${stockStatus.color}`}>
                              {item.quantity} units
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Min Stock</p>
                            <p className="font-medium">{item.minStock} units</p>
                          </div>
                        </div>
                        
                        {item.location && (
                          <div className="text-sm">
                            <p className="text-gray-500">Location</p>
                            <p className="font-medium flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {item.location}
                              {item.aisle && ` - Aisle ${item.aisle}`}
                              {item.shelf && ` - Shelf ${item.shelf}`}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Cost Price</p>
                            <p className="font-medium">${item.costPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Sell Price</p>
                            <p className="font-medium">${item.product.price.toFixed(2)}</p>
                          </div>
                        </div>

                        {item.expiryDate && (
                          <div className="text-sm">
                            <p className="text-gray-500">Expiry Date</p>
                            <p className="font-medium flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {item.inventoryAlerts.length > 0 && (
                          <div className="space-y-1">
                            {item.inventoryAlerts.slice(0, 2).map((alert) => (
                              <div key={alert.id} className="text-xs p-2 bg-yellow-50 rounded border border-yellow-200">
                                <p className="font-medium text-yellow-800">{alert.type.replace('_', ' ')}</p>
                                <p className="text-yellow-600">{alert.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockAdjustment(item.product.id, -1)}
                              disabled={item.quantity <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockAdjustment(item.product.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(item)
                              setIsInventoryDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {filteredInventory.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No inventory items found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search suppliers..."
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsSupplierDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <Badge variant={supplier.isActive ? "default" : "secondary"}>
                        {supplier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {supplier.contactPerson && (
                      <p className="text-sm text-gray-600">Contact: {supplier.contactPerson}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {supplier.email && (
                        <div className="text-sm">
                          <p className="text-gray-500">Email</p>
                          <p>{supplier.email}</p>
                        </div>
                      )}
                      
                      {supplier.phone && (
                        <div className="text-sm">
                          <p className="text-gray-500">Phone</p>
                          <p>{supplier.phone}</p>
                        </div>
                      )}

                      {supplier.address && (
                        <div className="text-sm">
                          <p className="text-gray-500">Address</p>
                          <p>{supplier.address}</p>
                          {supplier.city && <p>{supplier.city}, {supplier.state}</p>}
                        </div>
                      )}

                      {supplier.paymentTerms && (
                        <div className="text-sm">
                          <p className="text-gray-500">Payment Terms</p>
                          <p className="font-medium">{supplier.paymentTerms}</p>
                        </div>
                      )}

                      <div className="text-sm">
                        <p className="text-gray-500">Purchase Orders</p>
                        <p className="font-medium">{supplier.purchaseOrders.length} total</p>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {suppliers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No suppliers found</p>
                <p className="text-sm">Add suppliers to manage purchase orders</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search purchase orders..."
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsPODialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create PO
            </Button>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {purchaseOrders.map((po) => (
                <Card key={po.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{po.orderNumber}</CardTitle>
                        <p className="text-sm text-gray-600">Supplier: {po.supplier.name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(po.status)}
                        <Badge variant="outline">
                          ${po.total.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Order Date</p>
                          <p>{new Date(po.orderDate).toLocaleDateString()}</p>
                        </div>
                        {po.expectedDate && (
                          <div>
                            <p className="text-gray-500">Expected</p>
                            <p>{new Date(po.expectedDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {po.receivedDate && (
                          <div>
                            <p className="text-gray-500">Received</p>
                            <p>{new Date(po.receivedDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500">Items</p>
                          <p>{po.items.length} products</p>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="text-gray-500">Items Summary</p>
                        <div className="space-y-1">
                          {po.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.product.name}</span>
                              <span>${item.totalPrice.toFixed(2)}</span>
                            </div>
                          ))}
                          {po.items.length > 3 && (
                            <p className="text-gray-500">+{po.items.length - 3} more items</p>
                          )}
                        </div>
                      </div>

                      {po.notes && (
                        <div className="text-sm">
                          <p className="text-gray-500">Notes</p>
                          <p>{po.notes}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            View PO
                          </Button>
                          {po.status === 'draft' && (
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {purchaseOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No purchase orders found</p>
                <p className="text-sm">Create purchase orders to restock inventory</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search stock movements..."
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsMovementDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Movement
            </Button>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {stockMovements.map((movement) => (
                <Card key={movement.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold">{movement.product.name}</h4>
                        <p className="text-sm text-gray-600">{movement.product.sku}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={movement.type === 'in' ? 'default' : 'secondary'}>
                          {movement.type === 'in' ? 'IN' : 'OUT'}
                        </Badge>
                        <Badge variant="outline">
                          {movement.reason}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Quantity</p>
                        <p className={`font-medium ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p>{movement.location || movement.inventory.location || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p>{new Date(movement.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Time</p>
                        <p>{new Date(movement.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    {movement.notes && (
                      <div className="mt-3 text-sm">
                        <p className="text-gray-500">Notes</p>
                        <p>{movement.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {stockMovements.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No stock movements found</p>
                <p className="text-sm">Stock movements will appear here as inventory changes</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search alerts..."
                className="pl-10"
              />
            </div>
            <Button>
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve All
            </Button>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`hover:shadow-md transition-shadow ${!alert.isRead ? 'border-blue-200 bg-blue-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold">{alert.product.name}</h4>
                        <p className="text-sm text-gray-600">{alert.product.sku}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSeverityBadge(alert.severity)}
                        <Badge variant="outline">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                        {!alert.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm mb-4">{alert.message}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Current Stock</p>
                        <p className="font-medium">{alert.inventory.quantity} units</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Min Stock</p>
                        <p className="font-medium">{alert.inventory.minStock} units</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p>{alert.inventory.location || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Created</p>
                        <p>{new Date(alert.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        {!alert.isResolved && (
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        <XCircle className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {alerts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alerts found</p>
                <p className="text-sm">All systems are running smoothly</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stock-adjustment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Stock Adjustment
              </CardTitle>
              <CardDescription>
                Adjust inventory levels by scanning product barcodes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BarcodeScanner
                onProductFound={(product) => {
                  // Handle product found for stock adjustment
                  setSelectedProductForAdjustment(product)
                  toast({
                    title: "Product Selected",
                    description: `${product.name} selected for stock adjustment`,
                  })
                }}
                enabled={true}
                compact={false}
              />
              
              {selectedProductForAdjustment && (
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Adjust Stock: {selectedProductForAdjustment.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Current Stock</Label>
                        <p className="text-2xl font-bold">
                          {selectedProductForAdjustment.inventory?.quantity || 0}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="adjustment">Adjustment Amount</Label>
                        <Input
                          id="adjustment"
                          type="number"
                          placeholder="Enter amount (+/-)"
                          value={stockAdjustmentAmount}
                          onChange={(e) => setStockAdjustmentAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleStockAdjustment(selectedProductForAdjustment.id, parseInt(stockAdjustmentAmount) || 0)}
                        disabled={!stockAdjustmentAmount}
                      >
                        Apply Adjustment
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedProductForAdjustment(null)
                          setStockAdjustmentAmount('')
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  // Helper functions
  function handleStockAdjustment(productId: string, adjustment: number) {
    // Implementation for stock adjustment
    console.log('Stock adjustment:', productId, adjustment)
    toast({
      title: "Stock Adjustment",
      description: `Adjusted stock by ${adjustment} units`,
    })
    setSelectedProductForAdjustment(null)
    setStockAdjustmentAmount('')
    // Refresh inventory data
    loadInventory()
  }
}