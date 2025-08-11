"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  Users,
  Calendar,
  CreditCard,
  RefreshCw
} from 'lucide-react'

interface LicenseAlert {
  type: string
  severity: string
  message: string
  timestamp: string
}

interface LicenseMetrics {
  totalActivations: number
  activeActivations: number
  recentActivations: number
  suspiciousActivity: number
  lastActivity: string | null
  totalPayments: number
  lastPayment: string | null
}

interface MonitoringData {
  license: any
  metrics: LicenseMetrics
  alerts: LicenseAlert[]
}

interface StatusOverview {
  total: number
  active: number
  expired: number
  suspended: number
  cancelled: number
  expiringSoon: number
}

export default function LicenseMonitoring() {
  const [overview, setOverview] = useState<StatusOverview | null>(null)
  const [licenses, setLicenses] = useState<any[]>([])
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null)
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchMonitoringData()
  }, [])

  useEffect(() => {
    if (selectedLicense) {
      fetchLicenseMonitoring(selectedLicense)
    }
  }, [selectedLicense])

  const fetchMonitoringData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/licenses/monitoring')
      if (response.ok) {
        const data = await response.json()
        setOverview(data.statusOverview)
        setLicenses(data.licenses)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch monitoring data",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch monitoring data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLicenseMonitoring = async (licenseId: string) => {
    try {
      const response = await fetch(`/api/licenses/monitoring?licenseId=${licenseId}`)
      if (response.ok) {
        const data = await response.json()
        setMonitoringData(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch license monitoring data",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch license monitoring data",
        variant: "destructive"
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getSeverityIcon = (severity: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      critical: <XCircle className="h-4 w-4 text-red-600" />,
      high: <AlertTriangle className="h-4 w-4 text-orange-600" />,
      medium: <Clock className="h-4 w-4 text-yellow-600" />,
      low: <CheckCircle className="h-4 w-4 text-blue-600" />
    }
    return icons[severity] || <AlertTriangle className="h-4 w-4 text-gray-600" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">License Monitoring</h1>
          <p className="text-gray-600">Monitor license status, activations, and alerts</p>
        </div>
        <Button onClick={fetchMonitoringData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{overview.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{overview.active}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{overview.expired}</p>
                  <p className="text-sm text-gray-600">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{overview.expiringSoon}</p>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{overview.suspended}</p>
                  <p className="text-sm text-gray-600">Suspended</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold">{overview.cancelled}</p>
                  <p className="text-sm text-gray-600">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* License List */}
            <Card>
              <CardHeader>
                <CardTitle>Licenses</CardTitle>
                <CardDescription>
                  Click on a license to view detailed monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {licenses.map((license) => (
                      <div
                        key={license.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedLicense === license.id ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedLicense(license.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{license.clientName}</p>
                            <p className="text-xs text-gray-600">{license.clientEmail}</p>
                          </div>
                          <Badge 
                            variant={license.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize text-xs"
                          >
                            {license.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span className="font-mono">{license.licenseKey}</span>
                          <span>{license.activationCount}/{license.maxActivations} activations</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected License Details */}
            {monitoringData && (
              <Card>
                <CardHeader>
                  <CardTitle>License Details</CardTitle>
                  <CardDescription>
                    {monitoringData.license.clientName} - {monitoringData.license.licenseKey}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Activations:</span>
                        <span className="font-medium">{monitoringData.metrics.activeActivations}/{monitoringData.metrics.totalActivations}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Recent:</span>
                        <span className="font-medium">{monitoringData.metrics.recentActivations}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">Payments:</span>
                        <span className="font-medium">{monitoringData.metrics.totalPayments}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Suspicious:</span>
                        <span className="font-medium">{monitoringData.metrics.suspiciousActivity}</span>
                      </div>
                    </div>
                  </div>

                  {monitoringData.alerts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Active Alerts</h4>
                      <div className="space-y-2">
                        {monitoringData.alerts.map((alert, index) => (
                          <div
                            key={index}
                            className={`p-2 border rounded-lg ${getSeverityColor(alert.severity)}`}
                          >
                            <div className="flex items-center space-x-2">
                              {getSeverityIcon(alert.severity)}
                              <span className="text-sm font-medium">{alert.message}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                All alerts and notifications across licenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {licenses.flatMap(license => {
                    const alerts = generateLicenseAlerts(license)
                    return alerts.map((alert, index) => (
                      <div
                        key={`${license.id}-${index}`}
                        className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            {getSeverityIcon(alert.severity)}
                            <div>
                              <p className="font-medium text-sm">{alert.message}</p>
                              <p className="text-xs text-gray-600">{license.clientName}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs">
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent license activations and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.flatMap(license => [
                      ...license.activations.map(activation => ({
                        type: 'activation',
                        license: license.licenseKey,
                        client: license.clientName,
                        description: 'License activated',
                        timestamp: activation.activatedAt,
                        status: activation.isActive ? 'Active' : 'Inactive'
                      })),
                      ...license.payments.map(payment => ({
                        type: 'payment',
                        license: license.licenseKey,
                        client: license.clientName,
                        description: `Payment - ${payment.method}`,
                        timestamp: payment.createdAt,
                        status: payment.status
                      }))
                    ])
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 20)
                    .map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {activity.license.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{activity.client}</TableCell>
                        <TableCell>{activity.description}</TableCell>
                        <TableCell>
                          {new Date(activity.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={activity.status === 'Active' || activity.status === 'completed' ? 'default' : 'secondary'}
                            className="capitalize text-xs"
                          >
                            {activity.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to generate alerts (client-side version)
function generateLicenseAlerts(license: any): Array<{ type: string; severity: string; message: string; timestamp: string }> {
  const alerts: Array<{ type: string; severity: string; message: string; timestamp: string }> = []
  const now = new Date()

  // Expiration alerts
  if (license.expiresAt) {
    const daysUntilExpiry = Math.ceil(
      (new Date(license.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 0) {
      alerts.push({
        type: 'expiration',
        severity: 'critical',
        message: 'License has expired',
        timestamp: now.toISOString()
      })
    } else if (daysUntilExpiry <= 7) {
      alerts.push({
        type: 'expiration',
        severity: 'high',
        message: `License expires in ${daysUntilExpiry} days`,
        timestamp: now.toISOString()
      })
    } else if (daysUntilExpiry <= 30) {
      alerts.push({
        type: 'expiration',
        severity: 'medium',
        message: `License expires in ${daysUntilExpiry} days`,
        timestamp: now.toISOString()
      })
    }
  }

  // Activation limit alerts
  if (license.activationCount >= license.maxActivations * 0.8) {
    alerts.push({
      type: 'activation_limit',
      severity: license.activationCount >= license.maxActivations ? 'high' : 'medium',
      message: `License activation limit: ${license.activationCount}/${license.maxActivations}`,
      timestamp: now.toISOString()
    })
  }

  return alerts
}