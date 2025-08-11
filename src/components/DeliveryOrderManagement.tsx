'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Truck, 
  MapPin, 
  Clock,
  User,
  Package,
  DollarSign,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';

interface DeliveryOrder {
  id: string;
  orderId: string;
  saleId: string;
  storeId: string;
  deliveryPersonId?: string;
  deliveryAreaId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  deliveryType: string;
  deliveryFee: number;
  deliveryStatus: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  thirdPartyName?: string;
  thirdPartyTrackingId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  sale: {
    id: string;
    totalAmount: number;
    taxAmount: number;
    discount: number;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
    customer?: {
      id: string;
      name: string;
      phone: string;
    };
    saleItems: Array<{
      id: string;
      product: {
        id: string;
        name: string;
      };
      quantity: number;
      price: number;
    }>;
  };
  store: {
    id: string;
    name: string;
  };
  deliveryPerson?: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
    status: string;
  };
  deliveryArea?: {
    id: string;
    name: string;
    deliveryFee: number;
    estimatedTime: number;
  };
  statusUpdates: Array<{
    id: string;
    status: string;
    notes?: string;
    updatedAt: string;
  }>;
}

export function DeliveryOrderManagement() {
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DeliveryOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [formData, setFormData] = useState({
    saleId: '',
    storeId: '',
    deliveryAreaId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    deliveryNotes: '',
    deliveryType: 'home_delivery',
    deliveryFee: 0,
    estimatedDelivery: '',
    thirdPartyName: '',
    thirdPartyTrackingId: '',
  });

  useEffect(() => {
    fetchDeliveryOrders();
    fetchDeliveryPersons();
    fetchDeliveryAreas();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      const response = await fetch('/api/delivery-orders');
      if (response.ok) {
        const data = await response.json();
        setDeliveryOrders(data);
      }
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch delivery orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryPersons = async () => {
    try {
      const response = await fetch('/api/delivery-persons');
      if (response.ok) {
        const data = await response.json();
        setDeliveryPersons(data);
      }
    } catch (error) {
      console.error('Error fetching delivery persons:', error);
    }
  };

  const fetchDeliveryAreas = async () => {
    try {
      const response = await fetch('/api/delivery-areas');
      if (response.ok) {
        const data = await response.json();
        setDeliveryAreas(data);
      }
    } catch (error) {
      console.error('Error fetching delivery areas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingOrder 
        ? `/api/delivery-orders/${editingOrder.id}`
        : '/api/delivery-orders';
      
      const method = editingOrder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingOrder 
            ? 'Delivery order updated successfully'
            : 'Delivery order created successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchDeliveryOrders();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save delivery order',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving delivery order:', error);
      toast({
        title: 'Error',
        description: 'Failed to save delivery order',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (order: DeliveryOrder) => {
    setEditingOrder(order);
    setFormData({
      saleId: order.saleId,
      storeId: order.storeId,
      deliveryAreaId: order.deliveryAreaId || '',
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || '',
      deliveryAddress: order.deliveryAddress,
      deliveryNotes: order.deliveryNotes || '',
      deliveryType: order.deliveryType,
      deliveryFee: order.deliveryFee,
      estimatedDelivery: order.estimatedDelivery || '',
      thirdPartyName: order.thirdPartyName || '',
      thirdPartyTrackingId: order.thirdPartyTrackingId || '',
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery order?')) {
      return;
    }

    try {
      const response = await fetch(`/api/delivery-orders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Delivery order deleted successfully',
        });
        fetchDeliveryOrders();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete delivery order',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting delivery order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete delivery order',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string, deliveryPersonId?: string) => {
    try {
      const updateData: any = { deliveryStatus: status };
      if (deliveryPersonId) {
        updateData.deliveryPersonId = deliveryPersonId;
      }

      const response = await fetch(`/api/delivery-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Delivery status updated to ${status}`,
        });
        fetchDeliveryOrders();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update delivery status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update delivery status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingOrder(null);
    setFormData({
      saleId: '',
      storeId: '',
      deliveryAreaId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      deliveryAddress: '',
      deliveryNotes: '',
      deliveryType: 'home_delivery',
      deliveryFee: 0,
      estimatedDelivery: '',
      thirdPartyName: '',
      thirdPartyTrackingId: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'out_for_delivery':
        return 'bg-blue-500';
      case 'assigned':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home_delivery':
        return <Truck className="h-4 w-4" />;
      case 'third_party':
        return <Package className="h-4 w-4" />;
      case 'in_store_pickup':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Truck className="h-4 w-4" />;
    }
  };

  const filteredOrders = deliveryOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerPhone.includes(searchTerm) ||
                         order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.deliveryStatus === statusFilter;
    const matchesType = typeFilter === 'all' || order.deliveryType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Delivery Orders</h2>
          <p className="text-muted-foreground">
            Manage and track all delivery orders
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Delivery Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? 'Edit Delivery Order' : 'Create Delivery Order'}
              </DialogTitle>
              <DialogDescription>
                {editingOrder 
                  ? 'Update the delivery order information'
                  : 'Create a new delivery order'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Customer Phone *</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryType">Delivery Type</Label>
                  <Select value={formData.deliveryType} onValueChange={(value) => setFormData({ ...formData, deliveryType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_delivery">Home Delivery</SelectItem>
                      <SelectItem value="third_party">Third Party</SelectItem>
                      <SelectItem value="in_store_pickup">In Store Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                <Textarea
                  id="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryAreaId">Delivery Area</Label>
                  <Select value={formData.deliveryAreaId} onValueChange={(value) => setFormData({ ...formData, deliveryAreaId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery area" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name} - ${area.deliveryFee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.deliveryFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {formData.deliveryType === 'third_party' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="thirdPartyName">Third Party Name</Label>
                    <Input
                      id="thirdPartyName"
                      value={formData.thirdPartyName}
                      onChange={(e) => setFormData({ ...formData, thirdPartyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="thirdPartyTrackingId">Tracking ID</Label>
                    <Input
                      id="thirdPartyTrackingId"
                      value={formData.thirdPartyTrackingId}
                      onChange={(e) => setFormData({ ...formData, thirdPartyTrackingId: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="estimatedDelivery">Estimated Delivery Time</Label>
                <Input
                  id="estimatedDelivery"
                  type="datetime-local"
                  value={formData.estimatedDelivery}
                  onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingOrder ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="home_delivery">Home Delivery</SelectItem>
            <SelectItem value="third_party">Third Party</SelectItem>
            <SelectItem value="in_store_pickup">In Store Pickup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Delivery Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Orders</CardTitle>
          <CardDescription>
            All delivery orders with their current status and details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery Person</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.orderId}</div>
                    <div className="text-sm text-gray-500">
                      Sale #{order.saleId.slice(-8)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <User className="h-3 w-3 mr-1" />
                        {order.customerName}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-3 w-3 mr-1" />
                        {order.customerPhone}
                      </div>
                      {order.customerEmail && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {order.customerEmail}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(order.deliveryType)}
                      <span className="text-sm">
                        {order.deliveryType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(order.deliveryStatus)} text-white`}
                    >
                      {order.deliveryStatus.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.deliveryPerson ? order.deliveryPerson.name : 'Unassigned'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {order.deliveryFee.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {order.deliveryStatus === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No delivery orders found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Order Details</DialogTitle>
            <DialogDescription>
              Complete information about the delivery order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Order ID:</strong> {selectedOrder.orderId}</div>
                    <div><strong>Sale ID:</strong> {selectedOrder.saleId}</div>
                    <div><strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                    <div><strong>Type:</strong> {selectedOrder.deliveryType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    <div><strong>Status:</strong> 
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(selectedOrder.deliveryStatus)} text-white ml-2`}
                      >
                        {selectedOrder.deliveryStatus.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                    <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                    {selectedOrder.customerEmail && (
                      <div><strong>Email:</strong> {selectedOrder.customerEmail}</div>
                    )}
                    <div><strong>Address:</strong> {selectedOrder.deliveryAddress}</div>
                    {selectedOrder.deliveryNotes && (
                      <div><strong>Notes:</strong> {selectedOrder.deliveryNotes}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Delivery Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Delivery Fee:</strong> ${selectedOrder.deliveryFee.toFixed(2)}</div>
                    {selectedOrder.deliveryArea && (
                      <div><strong>Delivery Area:</strong> {selectedOrder.deliveryArea.name}</div>
                    )}
                    {selectedOrder.estimatedDelivery && (
                      <div><strong>Estimated Delivery:</strong> {new Date(selectedOrder.estimatedDelivery).toLocaleString()}</div>
                    )}
                    {selectedOrder.actualDelivery && (
                      <div><strong>Actual Delivery:</strong> {new Date(selectedOrder.actualDelivery).toLocaleString()}</div>
                    )}
                    {selectedOrder.thirdPartyName && (
                      <div><strong>Third Party:</strong> {selectedOrder.thirdPartyName}</div>
                    )}
                    {selectedOrder.thirdPartyTrackingId && (
                      <div><strong>Tracking ID:</strong> {selectedOrder.thirdPartyTrackingId}</div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Assignment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Delivery Person:</strong> {selectedOrder.deliveryPerson ? selectedOrder.deliveryPerson.name : 'Unassigned'}</div>
                    {selectedOrder.assignedAt && (
                      <div><strong>Assigned At:</strong> {new Date(selectedOrder.assignedAt).toLocaleString()}</div>
                    )}
                    {selectedOrder.pickedUpAt && (
                      <div><strong>Picked Up At:</strong> {new Date(selectedOrder.pickedUpAt).toLocaleString()}</div>
                    )}
                    {selectedOrder.deliveredAt && (
                      <div><strong>Delivered At:</strong> {new Date(selectedOrder.deliveredAt).toLocaleString()}</div>
                    )}
                    {selectedOrder.cancelledAt && (
                      <div><strong>Cancelled At:</strong> {new Date(selectedOrder.cancelledAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Updates */}
              <div>
                <h3 className="font-semibold mb-2">Status Updates</h3>
                <div className="space-y-2">
                  {selectedOrder.statusUpdates.map((update) => (
                    <div key={update.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(update.status)} text-white`}
                        >
                          {update.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm">{update.notes}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(update.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.sale.saleItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600">Subtotal: ${selectedOrder.sale.totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Tax: ${selectedOrder.sale.taxAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Discount: ${selectedOrder.sale.discount.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Delivery Fee: ${selectedOrder.deliveryFee.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      Total: ${(selectedOrder.sale.totalAmount + selectedOrder.deliveryFee).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                {selectedOrder.deliveryStatus === 'pending' && (
                  <Select onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryPersons.filter(p => p.status === 'available').map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}