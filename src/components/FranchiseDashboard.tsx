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
import { Users, UserPlus, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Key, Settings, BarChart3, Calendar, Shield } from 'lucide-react'

interface FranchiseData {
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
}

interface FranchiseClient {
  id: string
  clientName: string
  clientEmail: string
  clientCompany?: string
  status: string
  oneTimeFeePaid: boolean
  monthlyFeePaid: boolean
  lastPaymentDate?: string
  nextPaymentDate?: string
  totalPaid: number
}

interface FranchiseUser {
  id: string
  user: {
    id: string
    email: string
    name: string
    status: string
  }
  role: string
  isActive: boolean
  joinedAt: string
}

interface RoyaltyPayment {
  id: string
  amount: number
  currency: string
  paymentType: string
  status: string
  dueDate: string
  paidDate?: string
  paymentMethod?: string
  notes?: string
}

interface LicenseInfo {
  id: string
  licenseKey: string
  type: string
  status: string
  clientName: string
  clientEmail: string
  maxUsers: number
  maxStores: number
  activationCount: number
  maxActivations: number
  issuedAt: string
  expiresAt?: string
  lastActivatedAt?: string
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  oneTimeFee: number
  monthlyFee: number
  maxClients: number
  features: string[]
  isActive: boolean
}

export default function FranchiseDashboard() {
  const { user, isFranchise, hasFranchiseRole } = useAuth()
  const [franchiseData, setFranchiseData] = useState<FranchiseData | null>(null)
  const [clients, setClients] = useState<FranchiseClient[]>([])
  const [users, setUsers] = useState<FranchiseUser[]>([])
  const [royaltyPayments, setRoyaltyPayments] = useState<RoyaltyPayment[]>([])
  const [licenses, setLicenses] = useState<LicenseInfo[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showLicenseDetails, setShowLicenseDetails] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<LicenseInfo | null>(null)

  useEffect(() => {
    if (isFranchise() && user?.franchiseId) {
      fetchFranchiseData()
    }
  }, [isFranchise, user])

  const fetchFranchiseData = async () => {
    try {
      // Fetch franchise data
      const franchiseResponse = await fetch(`/api/franchise/${user?.franchiseId}`)
      if (franchiseResponse.ok) {
        const franchiseData = await franchiseResponse.json()
        setFranchiseData(franchiseData.franchise)
      }

      // Fetch clients
      const clientsResponse = await fetch(`/api/franchise/${user?.franchiseId}/clients`)
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData.clients)
      }

      // Fetch users
      const usersResponse = await fetch(`/api/franchise/${user?.franchiseId}/users`)
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
      }

      // Fetch royalty payments
      const paymentsResponse = await fetch(`/api/franchise/${user?.franchiseId}/payments`)
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        setRoyaltyPayments(paymentsData.payments)
      }

      // Fetch licenses
      const licensesResponse = await fetch(`/api/licenses/franchise/${user?.franchiseId}`)
      if (licensesResponse.ok) {
        const licensesData = await licensesResponse.json()
        setLicenses(licensesData.licenses)
      }

      // Fetch subscription plans
      const plansResponse = await fetch(`/api/franchise/${user?.franchiseId}/plans`)
      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setSubscriptionPlans(plansData.plans)
      }
    } catch (error) {
      console.error('Error fetching franchise data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>
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

  const getLicenseStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLicenseTypeBadge = (type: string) => {
    switch (type) {
      case 'lifetime':
        return <Badge variant="default" className="bg-purple-500">Lifetime</Badge>
      case 'monthly':
        return <Badge variant="default" className="bg-blue-500">Monthly</Badge>
      case 'yearly':
        return <Badge variant="default" className="bg-orange-500">Yearly</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading franchise dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isFranchise() || !franchiseData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have access to the franchise dashboard. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Franchise Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Franchise Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name} - {franchiseData.name}
          </p>
        </div>
        {franchiseData.isBlocked && (
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your franchise account is blocked due to outstanding payments. Please clear your dues to continue.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{franchiseData.currentClients}</div>
            <p className="text-xs text-muted-foreground">
              of {franchiseData.maxClients} maximum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.filter(l => l.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              of {licenses.length} total licenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${franchiseData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${franchiseData.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${franchiseData.outstandingBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {franchiseData.outstandingBalance > 0 ? 'Payment required' : 'All payments clear'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Fee</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${franchiseData.monthlyFee.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              per client per month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Client Management</h2>
              <p className="text-muted-foreground">
                Manage your franchise clients and their license status
              </p>
            </div>
            {hasFranchiseRole('admin') && (
              <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Create a new client under your franchise. They will receive a license key upon approval.
                    </DialogDescription>
                  </DialogHeader>
                  <AddClientForm onSuccess={() => {
                    setShowAddClient(false)
                    fetchFranchiseData()
                  }} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Clients</CardTitle>
              <CardDescription>
                List of all clients under your franchise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payments</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.clientName}</TableCell>
                      <TableCell>{client.clientEmail}</TableCell>
                      <TableCell>{client.clientCompany || '-'}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
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
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">License Management</h2>
              <p className="text-muted-foreground">
                Manage all licenses issued to your clients
              </p>
            </div>
            {hasFranchiseRole('admin') && (
              <Button>
                <Key className="mr-2 h-4 w-4" />
                Generate License
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Licenses</CardTitle>
              <CardDescription>
                Overview of all licenses issued to your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Key</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Activations</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-mono text-sm">
                        {license.licenseKey.substring(0, 20)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{license.clientName}</div>
                          <div className="text-sm text-muted-foreground">{license.clientEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getLicenseTypeBadge(license.type)}</TableCell>
                      <TableCell>{getLicenseStatusBadge(license.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {license.activationCount} / {license.maxActivations}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((license.activationCount / license.maxActivations) * 100)}% used
                        </div>
                      </TableCell>
                      <TableCell>
                        {license.expiresAt ? (
                          new Date(license.expiresAt) > new Date() ? (
                            <span className="text-sm text-green-600">
                              {new Date(license.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-sm text-red-600">
                              Expired
                            </span>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLicense(license)
                            setShowLicenseDetails(true)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
              <p className="text-muted-foreground">
                Manage users who can access your franchise dashboard
              </p>
            </div>
            {hasFranchiseRole('admin') && (
              <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account for your franchise dashboard
                    </DialogDescription>
                  </DialogHeader>
                  <AddUserForm onSuccess={() => {
                    setShowAddUser(false)
                    fetchFranchiseData()
                  }} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                List of all users with access to your franchise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.user.name}</TableCell>
                      <TableCell>{user.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payment History</h2>
            <p className="text-muted-foreground">
              View your royalty payment history and outstanding dues
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All royalty payments and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {royaltyPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{payment.paymentType.replace('_', ' ')}</TableCell>
                      <TableCell>${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                      <TableCell>{payment.paymentMethod || '-'}</TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
            <p className="text-muted-foreground">
              Manage your franchise subscription plans and pricing
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.isActive ? (
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">${plan.oneTimeFee.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">One-time fee</div>
                      <div className="text-lg font-semibold mt-2">${plan.monthlyFee.toFixed(2)}/month</div>
                      <div className="text-sm text-muted-foreground">per client</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Features:</div>
                      <ul className="text-sm space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">
                        Up to {plan.maxClients} clients
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit Plan
                      </Button>
                      <Button 
                        variant={plan.isActive ? "destructive" : "default"} 
                        size="sm" 
                        className="flex-1"
                      >
                        {plan.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Plan Comparison</CardTitle>
              <CardDescription>
                Compare all subscription plans side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>One-time Fee</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Max Clients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>${plan.oneTimeFee.toFixed(2)}</TableCell>
                      <TableCell>${plan.monthlyFee.toFixed(2)}</TableCell>
                      <TableCell>{plan.maxClients}</TableCell>
                      <TableCell>
                        {plan.isActive ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button 
                            variant={plan.isActive ? "destructive" : "default"} 
                            size="sm"
                          >
                            {plan.isActive ? "Deactivate" : "Activate"}
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

        <TabsContent value="settings" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Franchise Settings</h2>
            <p className="text-muted-foreground">
              Manage your franchise profile and settings
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Franchise Information</CardTitle>
              <CardDescription>
                Your franchise profile details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Franchise Name</Label>
                    <p className="text-sm text-muted-foreground">{franchiseData.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">{franchiseData.email}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div>{getStatusBadge(franchiseData.status)}</div>
                  </div>
                  <div>
                    <Label>Monthly Fee per Client</Label>
                    <p className="text-sm text-muted-foreground">${franchiseData.monthlyFee.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* License Details Dialog */}
      <LicenseDetailsDialog
        license={selectedLicense}
        open={showLicenseDetails}
        onClose={() => {
          setShowLicenseDetails(false)
          setSelectedLicense(null)
        }}
      />
    </div>
  )
}

// License Details Dialog Component
function LicenseDetailsDialog({ 
  license, 
  open, 
  onClose 
}: { 
  license: LicenseInfo | null
  open: boolean
  onClose: () => void 
}) {
  if (!license) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            License Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this license
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* License Key */}
          <div>
            <Label className="text-sm font-medium">License Key</Label>
            <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm">
              {license.licenseKey}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Client Name</Label>
              <p className="text-sm text-muted-foreground">{license.clientName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Client Email</Label>
              <p className="text-sm text-muted-foreground">{license.clientEmail}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">License Type</Label>
              <div className="mt-1">{getLicenseTypeBadge(license.type)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">{getLicenseStatusBadge(license.status)}</div>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Max Users</Label>
              <p className="text-sm text-muted-foreground">{license.maxUsers}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Max Stores</Label>
              <p className="text-sm text-muted-foreground">{license.maxStores}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Activations</Label>
              <div className="mt-1">
                <div className="text-sm">
                  {license.activationCount} / {license.maxActivations}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(license.activationCount / license.maxActivations) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round((license.activationCount / license.maxActivations) * 100)}% used
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Issued At</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(license.issuedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Activated</Label>
              <p className="text-sm text-muted-foreground">
                {license.lastActivatedAt 
                  ? new Date(license.lastActivatedAt).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
            {license.expiresAt && (
              <div>
                <Label className="text-sm font-medium">Expires At</Label>
                <p className={`text-sm ${
                  new Date(license.expiresAt) > new Date() 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {new Date(license.expiresAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="destructive" size="sm">
              Deactivate License
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add Client Form Component
function AddClientForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientCompany: '',
    clientPhone: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/franchise/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add client')
      }
    } catch (error) {
      alert('Failed to add client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="clientName">Client Name *</Label>
        <Input
          id="clientName"
          value={formData.clientName}
          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="clientEmail">Client Email *</Label>
        <Input
          id="clientEmail"
          type="email"
          value={formData.clientEmail}
          onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="clientCompany">Company</Label>
        <Input
          id="clientCompany"
          value={formData.clientCompany}
          onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="clientPhone">Phone</Label>
        <Input
          id="clientPhone"
          value={formData.clientPhone}
          onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Client'}
        </Button>
      </div>
    </form>
  )
}

// Add User Form Component
function AddUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    permissions: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/franchise/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add user')
      }
    } catch (error) {
      alert('Failed to add user')
    } finally {
      setLoading(false)
    }
  }

  return (
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
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="role">Role *</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="permissions">Permissions (JSON)</Label>
        <Textarea
          id="permissions"
          value={formData.permissions}
          onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
          placeholder='["manage_clients", "view_reports"]'
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add User'}
        </Button>
      </div>
    </form>
  )
}