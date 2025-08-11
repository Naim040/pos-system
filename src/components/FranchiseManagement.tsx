"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, UserPlus, Building, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Eye, Edit, Ban } from 'lucide-react'
import RoyaltyReports from './RoyaltyReports'

interface Franchise {
  id: string
  name: string
  email: string
  status: string
  oneTimeFee: number
  monthlyFee: number
  maxClients: number
  currentClients: number
  totalRevenue: number
  outstandingBalance: number
  isBlocked: boolean
  blockReason?: string
  contactPerson: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  website?: string
  businessLicense?: string
  taxId?: string
  contractStart?: string
  contractEnd?: string
  createdAt: string
  updatedAt: string
  _count: {
    clients: number
    users: number
    licenses: number
    royaltyPayments: number
  }
  users: Array<{
    user: {
      id: string
      email: string
      name: string
      status: string
    }
    role: string
    isActive: boolean
    joinedAt: string
  }>
  clients: Array<{
    id: string
    clientName: string
    clientEmail: string
    clientCompany?: string
    status: string
    oneTimeFeePaid: boolean
    monthlyFeePaid: boolean
    totalPaid: number
    createdAt: string
  }>
  royaltyPayments: Array<{
    id: string
    amount: number
    currency: string
    paymentType: string
    status: string
    dueDate: string
    paidDate?: string
    paymentMethod?: string
    notes?: string
  }>
}

interface NewFranchiseData {
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  website?: string
  contactPerson: string
  businessLicense?: string
  taxId?: string
  oneTimeFee: number
  monthlyFee: number
  maxClients: number
  contractStart?: string
  contractEnd?: string
  adminName: string
  adminEmail: string
}

export default function FranchiseManagement() {
  const { user, hasRole } = useAuth()
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateFranchise, setShowCreateFranchise] = useState(false)
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [blockReason, setBlockReason] = useState('')

  useEffect(() => {
    if (hasRole('admin')) {
      fetchFranchises()
    }
  }, [hasRole])

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/franchise/manage')
      if (response.ok) {
        const data = await response.json()
        setFranchises(data.franchises)
      }
    } catch (error) {
      console.error('Error fetching franchises:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Paid</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedFranchise || !newStatus) return

    try {
      const response = await fetch('/api/franchise/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_status',
          franchiseId: selectedFranchise.id,
          status: newStatus,
          blockReason: newStatus === 'suspended' ? blockReason : null
        }),
      })

      if (response.ok) {
        setShowStatusDialog(false)
        fetchFranchises()
        setSelectedFranchise(null)
        setNewStatus('')
        setBlockReason('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update franchise status')
      }
    } catch (error) {
      alert('Failed to update franchise status')
    }
  }

  const createFranchise = async (franchiseData: NewFranchiseData) => {
    try {
      const response = await fetch('/api/franchise/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...franchiseData
        }),
      })

      if (response.ok) {
        setShowCreateFranchise(false)
        fetchFranchises()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create franchise')
      }
    } catch (error) {
      alert('Failed to create franchise')
    }
  }

  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access franchise management. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading franchise management...</p>
        </div>
      </div>
    )
  }

  // Calculate summary statistics
  const totalFranchises = franchises.length
  const activeFranchises = franchises.filter(f => f.status === 'active' || f.status === 'approved').length
  const pendingFranchises = franchises.filter(f => f.status === 'pending').length
  const totalRevenue = franchises.reduce((sum, f) => sum + f.totalRevenue, 0)
  const totalOutstanding = franchises.reduce((sum, f) => sum + f.outstandingBalance, 0)
  const totalClients = franchises.reduce((sum, f) => sum + f.currentClients, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Franchise Management</h1>
          <p className="text-muted-foreground">
            Manage all franchises, their clients, and monitor royalty payments
          </p>
        </div>
        <Dialog open={showCreateFranchise} onOpenChange={setShowCreateFranchise}>
          <DialogTrigger asChild>
            <Button>
              <Building className="mr-2 h-4 w-4" />
              Create Franchise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Franchise</DialogTitle>
              <DialogDescription>
                Create a new franchise account with admin user
              </DialogDescription>
            </DialogHeader>
            <CreateFranchiseForm onSubmit={createFranchise} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Franchises</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFranchises}</div>
            <p className="text-xs text-muted-foreground">
              {activeFranchises} active, {pendingFranchises} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Across all franchises
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${totalOutstanding.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total unpaid dues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Franchises</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{franchises.filter(f => f.isBlocked).length}</div>
            <p className="text-xs text-muted-foreground">
              Due to non-payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="franchises" className="space-y-4">
        <TabsList>
          <TabsTrigger value="franchises">Franchises</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="royalties">Royalty Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="franchises" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Franchises</CardTitle>
              <CardDescription>
                Manage and monitor all franchise accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {franchises.map((franchise) => (
                    <TableRow key={franchise.id}>
                      <TableCell className="font-medium">{franchise.name}</TableCell>
                      <TableCell>{franchise.email}</TableCell>
                      <TableCell>{franchise.contactPerson}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(franchise.status)}
                          {franchise.isBlocked && (
                            <Badge variant="destructive" className="text-xs">
                              Blocked
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {franchise.currentClients} / {franchise.maxClients}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((franchise.currentClients / franchise.maxClients) * 100)}% capacity
                        </div>
                      </TableCell>
                      <TableCell>${franchise.totalRevenue.toFixed(2)}</TableCell>
                      <TableCell className={franchise.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                        ${franchise.outstandingBalance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFranchise(franchise)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFranchise(franchise)
                              setShowStatusDialog(true)
                              setNewStatus(franchise.status)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>
                Review and approve new franchise applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Business License</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {franchises
                    .filter(f => f.status === 'pending')
                    .map((franchise) => (
                      <TableRow key={franchise.id}>
                        <TableCell className="font-medium">{franchise.name}</TableCell>
                        <TableCell>{franchise.email}</TableCell>
                        <TableCell>{franchise.contactPerson}</TableCell>
                        <TableCell>{new Date(franchise.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {franchise.businessLicense ? (
                            <Badge variant="outline">Provided</Badge>
                          ) : (
                            <Badge variant="secondary">Not Provided</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFranchise(franchise)
                                setShowStatusDialog(true)
                                setNewStatus('approved')
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFranchise(franchise)
                                setShowStatusDialog(true)
                                setNewStatus('rejected')
                              }}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="royalties" className="space-y-4">
          <RoyaltyReports />
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>
                Review and approve new franchise applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Business License</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {franchises
                    .filter(f => f.status === 'pending')
                    .map((franchise) => (
                      <TableRow key={franchise.id}>
                        <TableCell className="font-medium">{franchise.name}</TableCell>
                        <TableCell>{franchise.email}</TableCell>
                        <TableCell>{franchise.contactPerson}</TableCell>
                        <TableCell>{new Date(franchise.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {franchise.businessLicense ? (
                            <Badge variant="default" className="bg-green-500">Provided</Badge>
                          ) : (
                            <Badge variant="secondary">Not Provided</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFranchise(franchise)
                                setShowStatusDialog(true)
                                setNewStatus('approved')
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedFranchise(franchise)
                                setShowStatusDialog(true)
                                setNewStatus('rejected')
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Franchise Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedFranchise?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === 'suspended' && (
              <div>
                <Label htmlFor="blockReason">Reason for Suspension</Label>
                <Textarea
                  id="blockReason"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Enter the reason for suspending this franchise..."
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate}>
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Franchise Details Dialog */}
      {selectedFranchise && (
        <Dialog open={!!selectedFranchise} onOpenChange={() => setSelectedFranchise(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Franchise Details - {selectedFranchise.name}</DialogTitle>
              <DialogDescription>
                Detailed information about this franchise
              </DialogDescription>
            </DialogHeader>
            <FranchiseDetails franchise={selectedFranchise} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Franchise Details Component
function FranchiseDetails({ franchise }: { franchise: Franchise }) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {franchise.name}</div>
            <div><strong>Email:</strong> {franchise.email}</div>
            <div><strong>Contact Person:</strong> {franchise.contactPerson}</div>
            <div><strong>Phone:</strong> {franchise.phone || 'N/A'}</div>
            <div><strong>Status:</strong> {franchise.status}</div>
            <div><strong>Blocked:</strong> {franchise.isBlocked ? 'Yes' : 'No'}</div>
            {franchise.blockReason && (
              <div><strong>Block Reason:</strong> {franchise.blockReason}</div>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Financial Information</h3>
          <div className="space-y-2 text-sm">
            <div><strong>One-time Fee:</strong> ${franchise.oneTimeFee.toFixed(2)}</div>
            <div><strong>Monthly Fee:</strong> ${franchise.monthlyFee.toFixed(2)}</div>
            <div><strong>Max Clients:</strong> {franchise.maxClients}</div>
            <div><strong>Current Clients:</strong> {franchise.currentClients}</div>
            <div><strong>Total Revenue:</strong> ${franchise.totalRevenue.toFixed(2)}</div>
            <div><strong>Outstanding Balance:</strong> ${franchise.outstandingBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Users */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Users ({franchise.users.length})</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {franchise.users.map((user) => (
              <TableRow key={user.user.id}>
                <TableCell>{user.user.name}</TableCell>
                <TableCell>{user.user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Clients */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Clients ({franchise.clients.length})</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payments</TableHead>
              <TableHead>Total Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {franchise.clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.clientName}</TableCell>
                <TableCell>{client.clientEmail}</TableCell>
                <TableCell>{client.clientCompany || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge variant={client.oneTimeFeePaid ? "default" : "secondary"}>
                      One-time: {client.oneTimeFeePaid ? "Paid" : "Pending"}
                    </Badge>
                    <Badge variant={client.monthlyFeePaid ? "default" : "secondary"}>
                      Monthly: {client.monthlyFeePaid ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>${client.totalPaid.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Create Franchise Form Component
function CreateFranchiseForm({ onSubmit }: { onSubmit: (data: NewFranchiseData) => void }) {
  const [formData, setFormData] = useState<NewFranchiseData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    contactPerson: '',
    businessLicense: '',
    taxId: '',
    oneTimeFee: 20.00,
    monthlyFee: 5.00,
    maxClients: 50,
    contractStart: '',
    contractEnd: '',
    adminName: '',
    adminEmail: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Franchise Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Franchise Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="contactPerson">Contact Person *</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="businessLicense">Business License</Label>
          <Input
            id="businessLicense"
            value={formData.businessLicense}
            onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="taxId">Tax ID</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="oneTimeFee">One-time Fee ($)</Label>
          <Input
            id="oneTimeFee"
            type="number"
            step="0.01"
            value={formData.oneTimeFee}
            onChange={(e) => setFormData({ ...formData, oneTimeFee: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="monthlyFee">Monthly Fee ($)</Label>
          <Input
            id="monthlyFee"
            type="number"
            step="0.01"
            value={formData.monthlyFee}
            onChange={(e) => setFormData({ ...formData, monthlyFee: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="maxClients">Max Clients</Label>
          <Input
            id="maxClients"
            type="number"
            value={formData.maxClients}
            onChange={(e) => setFormData({ ...formData, maxClients: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="contractStart">Contract Start</Label>
          <Input
            id="contractStart"
            type="date"
            value={formData.contractStart}
            onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="contractEnd">Contract End</Label>
          <Input
            id="contractEnd"
            type="date"
            value={formData.contractEnd}
            onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="adminName">Admin Name *</Label>
          <Input
            id="adminName"
            value={formData.adminName}
            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="adminEmail">Admin Email *</Label>
          <Input
            id="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onSubmit(formData)}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Franchise'}
        </Button>
      </div>
    </form>
  )
}