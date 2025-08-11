"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Users,
  Store,
  Calendar,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react'

interface License {
  id: string
  licenseKey: string
  type: string
  status: string
  clientName: string
  clientEmail: string
  maxUsers: number
  maxStores: number
  allowedDomains?: string
  hardwareBinding?: string
  activationCount: number
  maxActivations: number
  issuedAt: string
  expiresAt?: string
  lastActivatedAt?: string
  lastVerifiedAt?: string
  notes?: string
  activations: LicenseActivation[]
  payments: LicensePayment[]
}

interface LicenseActivation {
  id: string
  activationKey: string
  domain?: string
  hardwareId?: string
  ipAddress?: string
  isActive: boolean
  activatedAt: string
  lastVerifiedAt?: string
  deactivatedAt?: string
  deactivationReason?: string
}

interface LicensePayment {
  id: string
  amount: number
  currency: string
  paymentMethod: string
  transactionId?: string
  status: string
  periodStart: string
  periodEnd?: string
  notes?: string
  createdAt: string
}

export default function LicenseManagement() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  // Form state for creating/editing licenses
  const [formData, setFormData] = useState({
    type: 'lifetime',
    clientName: '',
    clientEmail: '',
    maxUsers: 1,
    maxStores: 1,
    allowedDomains: '',
    notes: ''
  })

  useEffect(() => {
    fetchLicenses()
  }, [])

  const fetchLicenses = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/licenses')
      if (response.ok) {
        const data = await response.json()
        setLicenses(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch licenses",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch licenses",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLicense = async () => {
    if (!formData.clientName || !formData.clientEmail) {
      toast({
        title: "Validation Error",
        description: "Client name and email are required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          allowedDomains: formData.allowedDomains ? formData.allowedDomains.split(',').map(d => d.trim()) : null
        }),
      })

      if (response.ok) {
        const newLicense = await response.json()
        setLicenses(prev => [newLicense, ...prev])
        setShowCreateDialog(false)
        resetForm()
        toast({
          title: "Success",
          description: `License created for ${newLicense.clientName}`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create license",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create license",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLicenseStatus = async (licenseId: string, status: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/licenses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-status',
          licenseId,
          status
        }),
      })

      if (response.ok) {
        const updatedLicense = await response.json()
        setLicenses(prev => prev.map(license => 
          license.id === licenseId ? updatedLicense : license
        ))
        toast({
          title: "Success",
          description: `License status updated to ${status}`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update license",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update license",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    })
  }

  const resetForm = () => {
    setFormData({
      type: 'lifetime',
      clientName: '',
      clientEmail: '',
      maxUsers: 1,
      maxStores: 1,
      allowedDomains: '',
      notes: ''
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      active: 'default',
      expired: 'destructive',
      suspended: 'secondary',
      cancelled: 'outline'
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      lifetime: 'bg-green-100 text-green-800',
      monthly: 'bg-blue-100 text-blue-800',
      yearly: 'bg-purple-100 text-purple-800'
    }

    return (
      <Badge className={`capitalize ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </Badge>
    )
  }

  const filteredLicenses = licenses.filter(license => {
    const matchesStatus = filterStatus === 'all' || license.status === filterStatus
    const matchesType = filterType === 'all' || license.type === filterType
    const matchesSearch = searchTerm === '' || 
      license.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesType && matchesSearch
  })

  const exportLicenses = () => {
    const csvContent = [
      ['License Key', 'Type', 'Status', 'Client Name', 'Client Email', 'Max Users', 'Max Stores', 'Activations', 'Issued At', 'Expires At'].join(','),
      ...filteredLicenses.map(license => [
        license.licenseKey,
        license.type,
        license.status,
        license.clientName,
        license.clientEmail,
        license.maxUsers,
        license.maxStores,
        license.activationCount,
        license.issuedAt,
        license.expiresAt || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `licenses_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">License Management</h1>
          <p className="text-gray-600">Manage software licenses and activations</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportLicenses}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create License
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Key className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{licenses.length}</p>
                <p className="text-sm text-gray-600">Total Licenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{licenses.filter(l => l.status === 'active').length}</p>
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
                <p className="text-2xl font-bold">{licenses.filter(l => l.status === 'expired').length}</p>
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
                <p className="text-2xl font-bold">
                  {licenses.reduce((sum, l) => sum + l.activationCount, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Activations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchLicenses} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Licenses</CardTitle>
          <CardDescription>
            Manage and monitor all software licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Activations</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {license.licenseKey}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(license.licenseKey)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(license.type)}</TableCell>
                    <TableCell>{getStatusBadge(license.status)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{license.clientName}</p>
                        <p className="text-sm text-gray-600">{license.clientEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {license.activationCount}/{license.maxActivations}
                        </span>
                        {license.activationCount > 0 && (
                          <Users className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">
                          {new Date(license.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {license.expiresAt ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(license.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {license.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateLicenseStatus(license.id, 'suspended')}
                          >
                            Suspend
                          </Button>
                        )}
                        {license.status === 'suspended' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateLicenseStatus(license.id, 'active')}
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingLicense(license)
                            setFormData({
                              type: license.type,
                              clientName: license.clientName,
                              clientEmail: license.clientEmail,
                              maxUsers: license.maxUsers,
                              maxStores: license.maxStores,
                              allowedDomains: license.allowedDomains || '',
                              notes: license.notes || ''
                            })
                            setShowCreateDialog(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create/Edit License Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLicense ? 'Edit License' : 'Create New License'}
            </DialogTitle>
            <DialogDescription>
              {editingLicense ? 'Update license information' : 'Generate a new software license'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">License Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStores">Max Stores</Label>
                <Input
                  id="maxStores"
                  type="number"
                  min="1"
                  value={formData.maxStores}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxStores: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowedDomains">Allowed Domains (comma-separated)</Label>
              <Input
                id="allowedDomains"
                placeholder="example.com, *.domain.com"
                value={formData.allowedDomains}
                onChange={(e) => setFormData(prev => ({ ...prev, allowedDomains: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLicense} disabled={loading}>
                {loading ? 'Creating...' : (editingLicense ? 'Update' : 'Create')} License
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}