"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Plus, Settings, Globe, Users, Store, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  email: string
  plan: string
  maxUsers: number
  maxStores: number
  customDomain: boolean
  isActive: boolean
  createdAt: string
  domains: Array<{ domain: string; isPrimary: boolean; isVerified: boolean }>
  users: Array<{ user: { email: string; name: string; role: string } }>
  subscriptions: Array<{ plan: string; status: string; currentPeriodEnd: string | null }>
  _count: { users: number; stores: number; domains: number }
}

interface Domain {
  id: string
  domain: string
  isPrimary: boolean
  isVerified: boolean
  sslEnabled: boolean
  tenant: { name: string; email: string }
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [showAddDomain, setShowAddDomain] = useState(false)
  const { toast } = useToast()

  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    plan: 'basic',
    maxUsers: 5,
    maxStores: 1
  })

  const [newDomain, setNewDomain] = useState({
    tenantId: '',
    domain: '',
    isPrimary: false
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    if (selectedTenant) {
      fetchDomains(selectedTenant)
    }
  }, [selectedTenant])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data.tenants)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tenants",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDomains = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/domains?tenantId=${tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setDomains(data.domains)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch domains",
        variant: "destructive"
      })
    }
  }

  const handleAddTenant = async () => {
    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Tenant created successfully"
        })
        setShowAddTenant(false)
        setNewTenant({ name: '', email: '', plan: 'basic', maxUsers: 5, maxStores: 1 })
        fetchTenants()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tenant",
        variant: "destructive"
      })
    }
  }

  const handleAddDomain = async () => {
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDomain)
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message
        })
        setShowAddDomain(false)
        setNewDomain({ tenantId: '', domain: '', isPrimary: false })
        if (selectedTenant) {
          fetchDomains(selectedTenant)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add domain",
        variant: "destructive"
      })
    }
  }

  const handleVerifyDomain = async (domainId: string) => {
    try {
      const response = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId })
      })

      const data = await response.json()
      
      if (data.verified) {
        toast({
          title: "Success",
          description: "Domain verified successfully"
        })
      } else {
        toast({
          title: "Verification Failed",
          description: data.message,
          variant: "destructive"
        })
      }

      if (selectedTenant) {
        fetchDomains(selectedTenant)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify domain",
        variant: "destructive"
      })
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-gray-100 text-gray-800'
      case 'professional': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-gray-600 mt-2">Manage multi-tenant POS instances and custom domains</p>
        </div>
        <Dialog open={showAddTenant} onOpenChange={setShowAddTenant}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tenant Name</Label>
                <Input
                  id="name"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Enter tenant name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="plan">Plan</Label>
                <Select value={newTenant.plan} onValueChange={(value) => setNewTenant({ ...newTenant, plan: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUsers">Max Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={newTenant.maxUsers}
                    onChange={(e) => setNewTenant({ ...newTenant, maxUsers: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxStores">Max Stores</Label>
                  <Input
                    id="maxStores"
                    type="number"
                    value={newTenant.maxStores}
                    onChange={(e) => setNewTenant({ ...newTenant, maxStores: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleAddTenant} className="w-full">
                Create Tenant
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                All Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading tenants...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Users/Stores</TableHead>
                      <TableHead>Domains</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>{tenant.email}</TableCell>
                        <TableCell>
                          <Badge className={getPlanBadgeColor(tenant.plan)}>
                            {tenant.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{tenant._count.users}/{tenant.maxUsers}</span>
                            <span>•</span>
                            <span>{tenant._count.stores}/{tenant.maxStores}</span>
                          </div>
                        </TableCell>
                        <TableCell>{tenant._count.domains}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.isActive ? "default" : "secondary"}>
                            {tenant.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTenant(tenant.id)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Domain Management</h2>
            <Dialog open={showAddDomain} onOpenChange={setShowAddDomain}>
              <DialogTrigger asChild>
                <Button>
                  <Globe className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Domain</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tenant">Tenant</Label>
                    <Select value={newDomain.tenantId} onValueChange={(value) => setNewDomain({ ...newDomain, tenantId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} ({tenant.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={newDomain.domain}
                      onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                      placeholder="example.com"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={newDomain.isPrimary}
                      onChange={(e) => setNewDomain({ ...newDomain, isPrimary: e.target.checked })}
                    />
                    <Label htmlFor="isPrimary">Primary Domain</Label>
                  </div>
                  <Button onClick={handleAddDomain} className="w-full">
                    Add Domain
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {selectedTenant && (
            <Card>
              <CardHeader>
                <CardTitle>Domains for {tenants.find(t => t.id === selectedTenant)?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SSL</TableHead>
                      <TableHead>Primary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">{domain.domain}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(domain.isVerified)}
                            <span>{domain.isVerified ? 'Verified' : 'Pending'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {domain.sslEnabled ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>{domain.sslEnabled ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {domain.isPrimary && (
                            <Badge variant="default">Primary</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!domain.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyDomain(domain.id)}
                            >
                              Verify
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}