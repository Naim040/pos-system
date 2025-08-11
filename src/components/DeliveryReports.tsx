'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

interface DeliveryReport {
  reportType: string;
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    assignedOrders: number;
    outForDeliveryOrders: number;
    cancelledOrders: number;
    failedOrders: number;
    successRate: number;
    totalDeliveryFees: number;
    totalSalesAmount: number;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
  };
  deliveryPersonStats: Array<{
    name: string;
    totalOrders: number;
    deliveredOrders: number;
    totalDeliveryFees: number;
    averageDeliveryTime: number;
  }>;
  deliveryAreaStats: Array<{
    name: string;
    totalOrders: number;
    deliveredOrders: number;
    totalDeliveryFees: number;
    averageDeliveryFee: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderId: string;
    customerName: string;
    deliveryStatus: string;
    deliveryFee: number;
    createdAt: string;
    deliveredAt?: string;
    deliveryPerson?: string;
  }>;
}

export function DeliveryReports() {
  const [reportData, setReportData] = useState<DeliveryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [storeId, setStoreId] = useState('');
  const [deliveryPersonId, setDeliveryPersonId] = useState('');

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setDateFrom(lastWeek.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
    
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        reportType,
      });
      
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (storeId) params.append('storeId', storeId);
      if (deliveryPersonId) params.append('deliveryPersonId', deliveryPersonId);

      const response = await fetch(`/api/delivery-reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch delivery report',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching delivery report:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch delivery report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!reportData) return;
    
    const csvContent = generateCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (data: DeliveryReport) => {
    const headers = [
      'Order ID',
      'Customer Name',
      'Status',
      'Delivery Fee',
      'Created Date',
      'Delivered Date',
      'Delivery Person'
    ];

    const rows = data.recentOrders.map(order => [
      order.orderId,
      order.customerName,
      order.deliveryStatus,
      order.deliveryFee.toString(),
      new Date(order.createdAt).toLocaleDateString(),
      order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : '',
      order.deliveryPerson || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
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
          <h2 className="text-2xl font-bold tracking-tight">Delivery Reports</h2>
          <p className="text-muted-foreground">
            Analyze delivery performance and generate insights
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchReport}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExportReport} disabled={!reportData}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Customize your report by selecting specific criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="storeId">Store (Optional)</Label>
              <Input
                id="storeId"
                placeholder="Store ID"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={fetchReport}>Generate Report</Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Summary Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Success rate: {reportData.summary.successRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Fees</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${reportData.summary.totalDeliveryFees.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Total sales: ${reportData.summary.totalSalesAmount.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Delivery Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.averageDeliveryTime}min</div>
                <p className="text-xs text-muted-foreground">
                  On-time rate: {reportData.summary.onTimeDeliveryRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.deliveredOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.summary.cancelledOrders} cancelled
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Status Overview</CardTitle>
              <CardDescription>Current status distribution for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{reportData.summary.pendingOrders}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{reportData.summary.assignedOrders}</div>
                  <div className="text-sm text-gray-500">Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{reportData.summary.outForDeliveryOrders}</div>
                  <div className="text-sm text-gray-500">Out for Delivery</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{reportData.summary.deliveredOrders}</div>
                  <div className="text-sm text-gray-500">Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{reportData.summary.cancelledOrders}</div>
                  <div className="text-sm text-gray-500">Cancelled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-700">{reportData.summary.failedOrders}</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Personnel Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Personnel Performance</CardTitle>
              <CardDescription>Performance metrics for each delivery person</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Total Fees</TableHead>
                    <TableHead>Avg. Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.deliveryPersonStats.map((person, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.totalOrders}</TableCell>
                      <TableCell>{person.deliveredOrders}</TableCell>
                      <TableCell>
                        {person.totalOrders > 0 
                          ? ((person.deliveredOrders / person.totalOrders) * 100).toFixed(1) + '%'
                          : '0%'
                        }
                      </TableCell>
                      <TableCell>${person.totalDeliveryFees.toFixed(2)}</TableCell>
                      <TableCell>{person.averageDeliveryTime}min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Delivery Area Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Area Performance</CardTitle>
              <CardDescription>Performance metrics for each delivery area</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area Name</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Total Fees</TableHead>
                    <TableHead>Avg. Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.deliveryAreaStats.map((area, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{area.name}</TableCell>
                      <TableCell>{area.totalOrders}</TableCell>
                      <TableCell>{area.deliveredOrders}</TableCell>
                      <TableCell>
                        {area.totalOrders > 0 
                          ? ((area.deliveredOrders / area.totalOrders) * 100).toFixed(1) + '%'
                          : '0%'
                        }
                      </TableCell>
                      <TableCell>${area.totalDeliveryFees.toFixed(2)}</TableCell>
                      <TableCell>${area.averageDeliveryFee.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Most recent delivery orders in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery Fee</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Delivery Person</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(order.deliveryStatus)} text-white`}
                        >
                          {order.deliveryStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>${order.deliveryFee.toFixed(2)}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{order.deliveryPerson || 'Unassigned'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}