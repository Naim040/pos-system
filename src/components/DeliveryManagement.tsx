'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { 
  Package, 
  MapPin, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { DeliveryPersonManagement } from './DeliveryPersonManagement';
import { DeliveryAreaManagement } from './DeliveryAreaManagement';
import { DeliveryOrderManagement } from './DeliveryOrderManagement';
import { DeliveryReports } from './DeliveryReports';

interface DeliveryStats {
  totalOrders: number;
  pendingOrders: number;
  assignedOrders: number;
  outForDelivery: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalDeliveryFees: number;
  averageDeliveryTime: number;
}

export default function DeliveryManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DeliveryStats>({
    totalOrders: 0,
    pendingOrders: 0,
    assignedOrders: 0,
    outForDelivery: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalDeliveryFees: 0,
    averageDeliveryTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryStats();
  }, []);

  const fetchDeliveryStats = async () => {
    try {
      const response = await fetch('/api/delivery-reports?reportType=daily');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalOrders: data.summary.totalOrders,
          pendingOrders: data.summary.pendingOrders,
          assignedOrders: data.summary.assignedOrders,
          outForDelivery: data.summary.outForDeliveryOrders,
          deliveredOrders: data.summary.deliveredOrders,
          cancelledOrders: data.summary.cancelledOrders,
          totalDeliveryFees: data.summary.totalDeliveryFees,
          averageDeliveryTime: data.summary.averageDeliveryTime,
        });
      }
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Delivery Management</h1>
          <p className="text-muted-foreground">
            Manage delivery personnel, areas, orders, and track performance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.deliveredOrders} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out for Delivery</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outForDelivery}</div>
            <p className="text-xs text-muted-foreground">
              In transit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalDeliveryFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg time: {stats.averageDeliveryTime}min
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status Overview</CardTitle>
                <CardDescription>Current delivery status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor('delivered')}`}></div>
                      <span className="text-sm">Delivered</span>
                    </div>
                    <span className="font-medium">{stats.deliveredOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor('out_for_delivery')}`}></div>
                      <span className="text-sm">Out for Delivery</span>
                    </div>
                    <span className="font-medium">{stats.outForDelivery}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor('assigned')}`}></div>
                      <span className="text-sm">Assigned</span>
                    </div>
                    <span className="font-medium">{stats.assignedOrders || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor('pending')}`}></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="font-medium">{stats.pendingOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor('cancelled')}`}></div>
                      <span className="text-sm">Cancelled</span>
                    </div>
                    <span className="font-medium">{stats.cancelledOrders}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common delivery tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('orders')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Delivery Order
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('personnel')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Delivery Personnel
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('areas')}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Configure Delivery Areas
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('reports')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Delivery Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <DeliveryOrderManagement />
        </TabsContent>

        <TabsContent value="personnel">
          <DeliveryPersonManagement />
        </TabsContent>

        <TabsContent value="areas">
          <DeliveryAreaManagement />
        </TabsContent>

        <TabsContent value="reports">
          <DeliveryReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}