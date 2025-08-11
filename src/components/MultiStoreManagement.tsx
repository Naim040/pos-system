"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Building, MapPin, Phone, Mail, Clock, Users, Package, TrendingUp, Truck, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock as ClockIcon } from 'lucide-react'

interface Store {
  id: string
  name: string
  code: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
  timezone: string
  currency: string
  isActive: boolean
  isHeadquarters: boolean
  openingHours?: string
  notes?: string
  createdAt: string
  updatedAt: string
  manager?: {
    id: string
    name: string
    email: string
  }
}

interface StockTransfer {
  id: string
  transferNumber: string
  fromStore: Store
  toStore: Store
  status: string
  transferDate: string
  expectedDate?: string
  completedDate?: string
  notes?: string
  requestedBy: string
  approvedBy?: string
  items: StockTransferItem[]
}

interface StockTransferItem {
  id: string
  product: {
    id: string
    name: string
    sku?: string
    barcode?: string
  }
  quantity: number
  transferredQuantity: number
  unitCost: number
  notes?: string
}

interface StoreReport {
  id: string
  store: Store
  reportType: string
  period: string
  totalSales: number
  totalProfit: number
  totalTransactions: number
  averageTransaction: number
  topProducts?: string
  customerMetrics?: string
  inventoryMetrics?: string
  generatedAt: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function MultiStoreManagement() {
  const [stores, setStores] = useState<Store[]>([])
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([])
  const [storeReports, setStoreReports] = useState<StoreReport[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const { toast } = useToast()

  // Form states
  const [newStore, setNewStore] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    timezone: 'UTC',
    currency: 'BDT',
    isActive: true,
    isHeadquarters: false,
    openingHours: '',
    notes: '',
    managerId: ''
  })

  const [newTransfer, setNewTransfer] = useState({
    fromStoreId: '',
    toStoreId: '',
    expectedDate: '',
    notes: '',
    items: [] as Array<{
      productId: string
      quantity: number
      unitCost: number
      notes?: string
    }>
  })

  useEffect(() => {
    fetchStores()
    fetchStockTransfers()
    fetchStoreReports()
    fetchUsers()
  }, [])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data)
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
      toast({
        title: "Error",
        description: "Failed to load stores",
        variant: "destructive"
      })
    }
  }

  const fetchStockTransfers = async () => {
    try {
      const response = await fetch('/api/stock-transfers')
      if (response.ok) {
        const data = await response.json()
        setStockTransfers(data)
      }
    } catch (error) {
      console.error('Error fetching stock transfers:', error)
    }
  }

  const fetchStoreReports = async () => {
    try {
      const response = await fetch('/api/store-reports')
      if (response.ok) {
        const data = await response.json()
        setStoreReports(data)
      }
    } catch (error) {
      console.error('Error fetching store reports:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const createStore = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStore),
      })

      if (response.ok) {
        await fetchStores()
        setShowCreateDialog(false)
        setNewStore({
          name: '',
          code: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          phone: '',
          email: '',
          timezone: 'UTC',
          currency: 'BDT',
          isActive: true,
          isHeadquarters: false,
          openingHours: '',
          notes: '',
          managerId: ''
        })
        toast({
          title: "Success",
          description: "Store created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create store",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create store",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await fetchStores()
        setEditingStore(null)
        toast({
          title: "Success",
          description: "Store updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update store",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update store",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createStockTransfer = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransfer),
      })

      if (response.ok) {
        await fetchStockTransfers()
        setShowTransferDialog(false)
        setNewTransfer({
          fromStoreId: '',
          toStoreId: '',
          expectedDate: '',
          notes: '',
          items: []
        })
        toast({
          title: "Success",
          description: "Stock transfer created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create stock transfer",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create stock transfer",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStockTransferStatus = async (transferId: string, status: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/stock-transfers/${transferId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await fetchStockTransfers()
        toast({
          title: "Success",
          description: `Stock transfer ${status} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update stock transfer",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock transfer",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'in_transit': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'in_transit': return <Truck className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Multi-Store Management</h1>
          <p className="text-gray-600">Manage multiple stores, inventory transfers, and centralized reporting</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Store
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Store</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Store Name</Label>
                    <Input
                      id="name"
                      value={newStore.name}
                      onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                      placeholder="Main Store"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Store Code</Label>
                    <Input
                      id="code"
                      value={newStore.code}
                      onChange={(e) => setNewStore({ ...newStore, code: e.target.value })}
                      placeholder="STORE001"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newStore.address}
                      onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newStore.city}
                      onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={newStore.state}
                      onChange={(e) => setNewStore({ ...newStore, state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={newStore.zipCode}
                      onChange={(e) => setNewStore({ ...newStore, zipCode: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newStore.country}
                      onChange={(e) => setNewStore({ ...newStore, country: e.target.value })}
                      placeholder="USA"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newStore.phone}
                      onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newStore.email}
                      onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                      placeholder="store@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={newStore.timezone} onValueChange={(value) => setNewStore({ ...newStore, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={newStore.currency} onValueChange={(value) => setNewStore({ ...newStore, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="managerId">Store Manager</Label>
                  <Select value={newStore.managerId} onValueChange={(value) => setNewStore({ ...newStore, managerId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.role === 'manager' || u.role === 'admin').map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={newStore.isActive}
                      onCheckedChange={(checked) => setNewStore({ ...newStore, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active Store</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isHeadquarters"
                      checked={newStore.isHeadquarters}
                      onCheckedChange={(checked) => setNewStore({ ...newStore, isHeadquarters: checked })}
                    />
                    <Label htmlFor="isHeadquarters">Headquarters</Label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="openingHours">Opening Hours (JSON)</Label>
                  <Textarea
                    id="openingHours"
                    value={newStore.openingHours}
                    onChange={(e) => setNewStore({ ...newStore, openingHours: e.target.value })}
                    placeholder='{"monday": "9:00-18:00", "tuesday": "9:00-18:00"}'
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newStore.notes}
                    onChange={(e) => setNewStore({ ...newStore, notes: e.target.value })}
                    placeholder="Additional store information..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createStore} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Store'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Truck className="h-4 w-4 mr-2" />
                Stock Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Stock Transfer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromStoreId">From Store</Label>
                    <Select value={newTransfer.fromStoreId} onValueChange={(value) => setNewTransfer({ ...newTransfer, fromStoreId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source store" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.filter(s => s.isActive).map(store => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name} ({store.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="toStoreId">To Store</Label>
                    <Select value={newTransfer.toStoreId} onValueChange={(value) => setNewTransfer({ ...newTransfer, toStoreId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination store" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.filter(s => s.isActive && s.id !== newTransfer.fromStoreId).map(store => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name} ({store.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="expectedDate">Expected Date</Label>
                  <Input
                    id="expectedDate"
                    type="date"
                    value={newTransfer.expectedDate}
                    onChange={(e) => setNewTransfer({ ...newTransfer, expectedDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newTransfer.notes}
                    onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                    placeholder="Transfer notes..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createStockTransfer} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Transfer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="stores" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="transfers">Stock Transfers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Card key={store.id} className="h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      {store.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {store.isHeadquarters && (
                        <Badge variant="secondary">HQ</Badge>
                      )}
                      <Badge variant={store.isActive ? "default" : "secondary"}>
                        {store.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{store.code}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {store.address && `${store.address}, `}
                        {store.city && `${store.city}, `}
                        {store.state && `${store.state} `}
                        {store.zipCode}
                      </span>
                    </div>
                    
                    {store.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                    
                    {store.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{store.email}</span>
                      </div>
                    )}
                    
                    {store.manager && (
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Manager: {store.manager.name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{store.timezone} • {store.currency}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Created: {new Date(store.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingStore(store)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedStore(store)}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {stockTransfers.map((transfer) => (
              <Card key={transfer.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Truck className="h-5 w-5 mr-2" />
                      Transfer #{transfer.transferNumber}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(transfer.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(transfer.status)}
                          <span className="ml-1">{transfer.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                      {transfer.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateStockTransferStatus(transfer.id, 'approved')}
                        >
                          Approve
                        </Button>
                      )}
                      {transfer.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => updateStockTransferStatus(transfer.id, 'in_transit')}
                        >
                          Start Transfer
                        </Button>
                      )}
                      {transfer.status === 'in_transit' && (
                        <Button
                          size="sm"
                          onClick={() => updateStockTransferStatus(transfer.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Transfer Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>From:</span>
                          <span className="font-medium">{transfer.fromStore.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>To:</span>
                          <span className="font-medium">{transfer.toStore.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transfer Date:</span>
                          <span>{new Date(transfer.transferDate).toLocaleDateString()}</span>
                        </div>
                        {transfer.expectedDate && (
                          <div className="flex justify-between">
                            <span>Expected Date:</span>
                            <span>{new Date(transfer.expectedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {transfer.completedDate && (
                          <div className="flex justify-between">
                            <span>Completed Date:</span>
                            <span>{new Date(transfer.completedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Requested By:</span>
                          <span>{transfer.requestedBy}</span>
                        </div>
                        {transfer.approvedBy && (
                          <div className="flex justify-between">
                            <span>Approved By:</span>
                            <span>{transfer.approvedBy}</span>
                          </div>
                        )}
                        {transfer.notes && (
                          <div className="mt-2">
                            <span className="font-medium">Notes:</span>
                            <p className="text-gray-600">{transfer.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Transfer Items</h4>
                      <div className="space-y-2">
                        {transfer.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-gray-600">
                                {item.product.sku && `SKU: ${item.product.sku}`}
                                {item.product.barcode && ` • Barcode: ${item.product.barcode}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{item.quantity} units</div>
                              <div className="text-sm text-gray-600">
                                ${item.unitCost.toFixed(2)} each
                              </div>
                              <div className="text-sm text-gray-600">
                                {item.transferredQuantity}/{item.quantity} transferred
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storeReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    {report.store.name} - {report.reportType}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Period: {report.period}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Sales:</span>
                      <span className="font-medium">${report.totalSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Profit:</span>
                      <span className="font-medium">${report.totalProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Transactions:</span>
                      <span className="font-medium">{report.totalTransactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Transaction:</span>
                      <span className="font-medium">${report.averageTransaction.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="text-xs text-gray-600">
                      Generated: {new Date(report.generatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Total Stores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stores.length}</div>
                <div className="text-sm text-gray-600">
                  {stores.filter(s => s.isActive).length} active
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Active Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stockTransfers.filter(t => ['pending', 'approved', 'in_transit'].includes(t.status)).length}
                </div>
                <div className="text-sm text-gray-600">
                  {stockTransfers.filter(t => t.status === 'pending').length} pending approval
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Total Sales (All Stores)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${storeReports.reduce((sum, report) => sum + report.totalSales, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  Across {storeReports.length} reports
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Headquarters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stores.filter(s => s.isHeadquarters).length}
                </div>
                <div className="text-sm text-gray-600">
                  {stores.find(s => s.isHeadquarters)?.name || 'None set'}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Store Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stores.map((store) => {
                  const storeReport = storeReports.find(r => r.store.id === store.id)
                  return (
                    <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-medium">{store.name}</div>
                          <div className="text-sm text-gray-600">{store.code}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {storeReport ? (
                          <div>
                            <div className="font-medium">${storeReport.totalSales.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">
                              {storeReport.totalTransactions} transactions
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No data available</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}