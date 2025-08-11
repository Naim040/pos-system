'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  MapPin, 
  Clock, 
  DollarSign,
  Package,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface DeliveryArea {
  id: string;
  name: string;
  description?: string;
  storeId: string;
  store: {
    id: string;
    name: string;
  };
  areaCode?: string;
  boundaries?: string;
  deliveryFee: number;
  minOrder: number;
  estimatedTime: number;
  isActive: boolean;
  deliveries: Array<{
    id: string;
    deliveryStatus: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function DeliveryAreaManagement() {
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    storeId: '',
    areaCode: '',
    boundaries: '',
    deliveryFee: 0,
    minOrder: 0,
    estimatedTime: 30,
    isActive: true,
  });

  useEffect(() => {
    fetchDeliveryAreas();
  }, []);

  const fetchDeliveryAreas = async () => {
    try {
      const response = await fetch('/api/delivery-areas');
      if (response.ok) {
        const data = await response.json();
        setDeliveryAreas(data);
      }
    } catch (error) {
      console.error('Error fetching delivery areas:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch delivery areas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingArea 
        ? `/api/delivery-areas/${editingArea.id}`
        : '/api/delivery-areas';
      
      const method = editingArea ? 'PUT' : 'POST';
      
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
          description: editingArea 
            ? 'Delivery area updated successfully'
            : 'Delivery area created successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchDeliveryAreas();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save delivery area',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving delivery area:', error);
      toast({
        title: 'Error',
        description: 'Failed to save delivery area',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (area: DeliveryArea) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      description: area.description || '',
      storeId: area.storeId,
      areaCode: area.areaCode || '',
      boundaries: area.boundaries || '',
      deliveryFee: area.deliveryFee,
      minOrder: area.minOrder,
      estimatedTime: area.estimatedTime,
      isActive: area.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery area?')) {
      return;
    }

    try {
      const response = await fetch(`/api/delivery-areas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Delivery area deleted successfully',
        });
        fetchDeliveryAreas();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete delivery area',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting delivery area:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete delivery area',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/delivery-areas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Delivery area ${isActive ? 'activated' : 'deactivated'} successfully`,
        });
        fetchDeliveryAreas();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update delivery area',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating delivery area:', error);
      toast({
        title: 'Error',
        description: 'Failed to update delivery area',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingArea(null);
    setFormData({
      name: '',
      description: '',
      storeId: '',
      areaCode: '',
      boundaries: '',
      deliveryFee: 0,
      minOrder: 0,
      estimatedTime: 30,
      isActive: true,
    });
  };

  const filteredAreas = deliveryAreas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (area.areaCode && area.areaCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesActive = !activeFilter || 
                         (activeFilter === 'active' && area.isActive) ||
                         (activeFilter === 'inactive' && !area.isActive);
    return matchesSearch && matchesActive;
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
          <h2 className="text-2xl font-bold tracking-tight">Delivery Areas</h2>
          <p className="text-muted-foreground">
            Configure delivery zones, fees, and coverage areas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Delivery Area
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingArea ? 'Edit Delivery Area' : 'Add Delivery Area'}
              </DialogTitle>
              <DialogDescription>
                {editingArea 
                  ? 'Update the delivery area configuration'
                  : 'Add a new delivery area to your service zones'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Area Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="areaCode">Area Code/Postal Code</Label>
                <Input
                  id="areaCode"
                  value={formData.areaCode}
                  onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="minOrder">Minimum Order ($)</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="estimatedTime">Estimated Delivery Time (minutes)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  min="1"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div>
                <Label htmlFor="boundaries">Area Boundaries (JSON)</Label>
                <Textarea
                  id="boundaries"
                  placeholder='{"coordinates": [[lat, lng], ...]}'
                  value={formData.boundaries}
                  onChange={(e) => setFormData({ ...formData, boundaries: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingArea ? 'Update' : 'Create'}
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
              placeholder="Search delivery areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={activeFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('')}
          >
            All
          </Button>
          <Button
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={activeFilter === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('inactive')}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Delivery Areas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Zones</CardTitle>
          <CardDescription>
            Configured delivery areas with their respective fees and requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area Name</TableHead>
                <TableHead>Area Code</TableHead>
                <TableHead>Delivery Fee</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Est. Time</TableHead>
                <TableHead>Active Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAreas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{area.name}</div>
                        {area.description && (
                          <div className="text-sm text-gray-500">{area.description}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{area.areaCode || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {area.deliveryFee.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Package className="h-3 w-3 mr-1" />
                      ${area.minOrder.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {area.estimatedTime} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {area.deliveries.filter(d => 
                        ['pending', 'assigned', 'out_for_delivery'].includes(d.deliveryStatus)
                      ).length}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={area.isActive}
                        onCheckedChange={(checked) => handleToggleActive(area.id, checked)}
                      />
                      <Badge variant={area.isActive ? 'default' : 'secondary'}>
                        {area.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(area)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(area.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredAreas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No delivery areas found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}