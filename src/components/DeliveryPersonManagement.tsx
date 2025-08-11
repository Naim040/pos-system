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
  Phone, 
  Mail, 
  MapPin, 
  Bike,
  Car,
  User,
  Calendar
} from 'lucide-react';

interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  vehicleType: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  status: string;
  storeId: string;
  store: {
    id: string;
    name: string;
  };
  deliveries: Array<{
    id: string;
    deliveryStatus: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function DeliveryPersonManagement() {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<DeliveryPerson | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    vehicleType: 'motorcycle',
    vehicleNumber: '',
    licenseNumber: '',
    storeId: '',
    notes: '',
  });

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

  const fetchDeliveryPersons = async () => {
    try {
      const response = await fetch('/api/delivery-persons');
      if (response.ok) {
        const data = await response.json();
        setDeliveryPersons(data);
      }
    } catch (error) {
      console.error('Error fetching delivery persons:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch delivery persons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPerson 
        ? `/api/delivery-persons/${editingPerson.id}`
        : '/api/delivery-persons';
      
      const method = editingPerson ? 'PUT' : 'POST';
      
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
          description: editingPerson 
            ? 'Delivery person updated successfully'
            : 'Delivery person created successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchDeliveryPersons();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save delivery person',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving delivery person:', error);
      toast({
        title: 'Error',
        description: 'Failed to save delivery person',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (person: DeliveryPerson) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      phone: person.phone,
      email: person.email || '',
      address: person.address || '',
      vehicleType: person.vehicleType,
      vehicleNumber: person.vehicleNumber || '',
      licenseNumber: person.licenseNumber || '',
      storeId: person.storeId,
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery person?')) {
      return;
    }

    try {
      const response = await fetch(`/api/delivery-persons/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Delivery person deleted successfully',
        });
        fetchDeliveryPersons();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete delivery person',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting delivery person:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete delivery person',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingPerson(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      vehicleType: 'motorcycle',
      vehicleNumber: '',
      licenseNumber: '',
      storeId: '',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      case 'on_leave':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'motorcycle':
        return <Bike className="h-4 w-4" />;
      case 'car':
        return <Car className="h-4 w-4" />;
      case 'bicycle':
        return <Bike className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const filteredPersons = deliveryPersons.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
    return matchesSearch && matchesStatus;
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
          <h2 className="text-2xl font-bold tracking-tight">Delivery Personnel</h2>
          <p className="text-muted-foreground">
            Manage your delivery team and their assignments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Delivery Person
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPerson ? 'Edit Delivery Person' : 'Add Delivery Person'}
              </DialogTitle>
              <DialogDescription>
                {editingPerson 
                  ? 'Update the delivery person information'
                  : 'Add a new delivery person to your team'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPerson ? 'Update' : 'Create'}
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
              placeholder="Search delivery persons..."
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Delivery Persons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Team</CardTitle>
          <CardDescription>
            List of all delivery personnel and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Deliveries</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersons.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-sm text-gray-500">
                          {getVehicleIcon(person.vehicleType)}
                          <span className="ml-1">{person.vehicleType}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {person.phone}
                      </div>
                      {person.email && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {person.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {person.vehicleNumber && (
                        <div className="font-medium">{person.vehicleNumber}</div>
                      )}
                      {person.licenseNumber && (
                        <div className="text-gray-500">License: {person.licenseNumber}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(person.status)} text-white`}
                    >
                      {person.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {person.deliveries.filter(d => 
                        ['assigned', 'out_for_delivery'].includes(d.deliveryStatus)
                      ).length}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{person.store.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(person)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(person.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPersons.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No delivery persons found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}