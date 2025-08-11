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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
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
  RefreshCw,
  Shield,
  Zap,
  BarChart3,
  Settings,
  Activity,
  Fingerprint,
  Server,
  Globe
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
  verificationScore?: number
  riskLevel?: 'low' | 'medium' | 'high'
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

interface LicenseTemplate {
  id: string
  name: string
  description: string
  type: string
  maxUsers: number
  maxStores: number
  maxActivations: number
  duration: number // in months, 0 for lifetime
  price: number
  features: string[]
  isActive: boolean
}

interface VerificationResult {
  isValid: boolean
  licenseKey: string
  status: string
  clientInfo: {
    name: string
    email: string
  }
  restrictions: {
    maxUsers: number
    maxStores: number
    maxActivations: number
  }
  currentActivations: number
  expiresAt?: string
  lastVerified: string
  riskLevel: 'low' | 'medium' | 'high'
  verificationScore: number
}

export default function EnhancedLicenseManagement() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [templates, setTemplates] = useState<LicenseTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [verificationKey, setVerificationKey] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [verifying, setVerifying] = useState(false)
  const { toast } = useToast()

  // Form state for creating/editing licenses
  const [formData, setFormData] = useState({
    type: 'lifetime',
    clientName: '',
    clientEmail: '',
    maxUsers: 1,
    maxStores: 1,
    maxActivations: 3,
    allowedDomains: '',
    hardwareBinding: '',
    notes: ''
  })

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    type: 'lifetime',
    maxUsers: 1,
    maxStores: 1,
    maxActivations: 3,
    duration: 0,
    price: 0,
    features: '',
    isActive: true
  })

  useEffect(() => {
    fetchLicenses()
    fetchTemplates()
  }, [])

  const fetchLicenses = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/licenses/enhanced')
      if (response.ok) {
        const data = await response.json()
        setLicenses(data.licenses)
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

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/licenses/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
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
      const response = await fetch('/api/licenses/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...formData,
          allowedDomains: formData.allowedDomains ? formData.allowedDomains.split(',').map(d => d.trim()) : null,
          hardwareBinding: formData.hardwareBinding ? JSON.parse(formData.hardwareBinding) : null
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

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.description) {
      toast({
        title: "Validation Error",
        description: "Template name and description are required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/licenses/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...templateForm,
          features: templateForm.features.split(',').map(f => f.trim()).filter(f => f)
        }),
      })

      if (response.ok) {
        const newTemplate = await response.json()
        setTemplates(prev => [...prev, newTemplate])
        setShowTemplateDialog(false)
        resetTemplateForm()
        toast({
          title: "Success",
          description: `Template "${newTemplate.name}" created`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create template",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyLicense = async () => {
    if (!verificationKey.trim()) {
      toast({
        title: "Validation Error",
        description: "License key is required",
        variant: "destructive"
      })
      return
    }

    setVerifying(true)
    try {
      const response = await fetch('/api/licenses/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: verificationKey.trim(),
          includeDetails: true
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setVerificationResult(data)
        toast({
          title: "Verification Complete",
          description: `License verification ${data.isValid ? 'successful' : 'failed'}`,
        })
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Failed to verify license",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to connect to verification server",
        variant: "destructive"
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleBulkGenerate = async () => {
    const template = templates.find(t => t.id === templateForm.name)
    if (!template) {
      toast({
        title: "Error",
        description: "Please select a valid template",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/licenses/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk-generate',
          templateId: template.id,
          count: 10 // Default count
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setLicenses(prev => [...result.licenses, ...prev])
        toast({
          title: "Success",
          description: `Generated ${result.count} licenses from template`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to generate licenses",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate licenses",
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
      maxActivations: 3,
      allowedDomains: '',
      hardwareBinding: '',
      notes: ''
    })
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      type: 'lifetime',
      maxUsers: 1,
      maxStores: 1,
      maxActivations: 3,
      duration: 0,
      price: 0,
      features: '',
      isActive: true
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
      yearly: 'bg-purple-100 text-purple-800',
      trial: 'bg-orange-100 text-orange-800'
    }

    return (
      <Badge className={`capitalize ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </Badge>
    )
  }

  const getRiskBadge = (riskLevel: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={`capitalize ${colors[riskLevel] || 'bg-gray-100 text-gray-800'}`}>
        {riskLevel}
      </Badge>
    )
  }

  const filteredLicenses = licenses.filter(license => {
    const matchesStatus = filterStatus === 'all' || license.status === filterStatus
    const matchesType = filterType === 'all' || license.type === filterType
    const matchesRisk = filterRisk === 'all' || license.riskLevel === filterRisk
    const matchesSearch = searchTerm === '' || 
      license.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesType && matchesRisk && matchesSearch
  })

  // Calculate statistics
  const totalLicenses = licenses.length
  const activeLicenses = licenses.filter(l => l.status === 'active').length
  const expiredLicenses = licenses.filter(l => l.status === 'expired').length
  const highRiskLicenses = licenses.filter(l => l.riskLevel === 'high').length
  const totalActivations = licenses.reduce((sum, l) => sum + l.activationCount, 0)
  const avgVerificationScore = licenses.length > 0 
    ? licenses.reduce((sum, l) => sum + (l.verificationScore || 0), 0) / licenses.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced License Management</h1>
          <p className="text-gray-600">Advanced license generation, verification, and monitoring</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowVerifyDialog(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Verify License
          </Button>
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create License
          </Button>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Key className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalLicenses}</p>
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
                <p className="text-2xl font-bold">{activeLicenses}</p>
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
                <p className="text-2xl font-bold">{expiredLicenses}</p>
                <p className="text-sm text-gray-600">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{highRiskLicenses}</p>
                <p className="text-sm text-gray-600">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{totalActivations}</p>
                <p className="text-sm text-gray-600">Activations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold">{avgVerificationScore.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Avg. Trust Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="licenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses" className="space-y-4">
          {/* Advanced Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search licenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full lg:w-48">
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
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRisk} onValueChange={setFilterRisk}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchLicenses} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Licenses Table */}
          <Card>
            <CardHeader>
              <CardTitle>Licenses</CardTitle>
              <CardDescription>
                Advanced license management with risk assessment and verification scoring
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
                      <TableHead>Risk</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Activations</TableHead>
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
                        <TableCell>{getRiskBadge(license.riskLevel || 'low')}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{license.clientName}</p>
                            <p className="text-sm text-gray-600">{license.clientEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <Progress value={license.verificationScore || 0} className="h-2" />
                            </div>
                            <span className="text-sm font-medium">
                              {license.verificationScore || 0}%
                            </span>
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
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingLicense(license)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(license.licenseKey)}
                            >
                              <Copy className="h-3 w-3" />
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>License Templates</CardTitle>
              <CardDescription>
                Predefined license configurations for quick generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        </div>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <div className="font-medium">{template.type}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Price:</span>
                          <div className="font-medium">${template.price}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Users:</span>
                          <div className="font-medium">{template.maxUsers}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Stores:</span>
                          <div className="font-medium">{template.maxStores}</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Features:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {template.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => {
                          setTemplateForm(prev => ({ ...prev, name: template.id }))
                          handleBulkGenerate()
                        }}
                      >
                        Generate from Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>License Distribution</CardTitle>
                <CardDescription>Breakdown by type and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Lifetime Licenses</span>
                      <span className="text-sm text-gray-600">
                        {licenses.filter(l => l.type === 'lifetime').length}
                      </span>
                    </div>
                    <Progress 
                      value={(licenses.filter(l => l.type === 'lifetime').length / totalLicenses) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Monthly Licenses</span>
                      <span className="text-sm text-gray-600">
                        {licenses.filter(l => l.type === 'monthly').length}
                      </span>
                    </div>
                    <Progress 
                      value={(licenses.filter(l => l.type === 'monthly').length / totalLicenses) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Yearly Licenses</span>
                      <span className="text-sm text-gray-600">
                        {licenses.filter(l => l.type === 'yearly').length}
                      </span>
                    </div>
                    <Progress 
                      value={(licenses.filter(l => l.type === 'yearly').length / totalLicenses) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Security risk distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Low Risk</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {licenses.filter(l => l.riskLevel === 'low').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">Medium Risk</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">
                      {licenses.filter(l => l.riskLevel === 'medium').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-medium">High Risk</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">
                      {licenses.filter(l => l.riskLevel === 'high').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>Live license verification and activation monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Real-time monitoring is active. System checks license validity every 5 minutes.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Fingerprint className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-lg font-bold">Active Verifications</p>
                          <p className="text-sm text-gray-600">Last 24 hours</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Server className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-lg font-bold">System Health</p>
                          <p className="text-sm text-gray-600">All systems operational</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="text-lg font-bold">Global Coverage</p>
                          <p className="text-sm text-gray-600">150+ countries</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create License Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Enhanced License</DialogTitle>
            <DialogDescription>
              Generate a new license with advanced security features
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">License Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxStores">Max Stores</Label>
                <Input
                  id="maxStores"
                  type="number"
                  value={formData.maxStores}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxStores: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxActivations">Max Activations</Label>
                <Input
                  id="maxActivations"
                  type="number"
                  value={formData.maxActivations}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxActivations: parseInt(e.target.value) }))}
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
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLicense} disabled={loading}>
                {loading ? 'Creating...' : 'Create License'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create License Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for license generation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateType">License Type</Label>
                <Select value={templateForm.type} onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateMaxUsers">Max Users</Label>
                <Input
                  id="templateMaxUsers"
                  type="number"
                  value={templateForm.maxUsers}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateMaxStores">Max Stores</Label>
                <Input
                  id="templateMaxStores"
                  type="number"
                  value={templateForm.maxStores}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, maxStores: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templatePrice">Price ($)</Label>
                <Input
                  id="templatePrice"
                  type="number"
                  value={templateForm.price}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateDuration">Duration (months, 0 for lifetime)</Label>
                <Input
                  id="templateDuration"
                  type="number"
                  value={templateForm.duration}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateMaxActivations">Max Activations</Label>
                <Input
                  id="templateMaxActivations"
                  type="number"
                  value={templateForm.maxActivations}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, maxActivations: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateFeatures">Features (comma-separated)</Label>
              <Input
                id="templateFeatures"
                placeholder="POS, Inventory, Reports, Analytics"
                value={templateForm.features}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, features: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verify License Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verify License</DialogTitle>
            <DialogDescription>
              Check the validity and details of a license key
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationKey">License Key</Label>
              <Input
                id="verificationKey"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={verificationKey}
                onChange={(e) => setVerificationKey(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            
            <Button 
              onClick={handleVerifyLicense} 
              disabled={verifying || !verificationKey.trim()}
              className="w-full"
            >
              {verifying ? 'Verifying...' : 'Verify License'}
            </Button>
            
            {verificationResult && (
              <div className="space-y-4">
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={verificationResult.isValid ? 'default' : 'destructive'}>
                      {verificationResult.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Risk Level:</span>
                    {getRiskBadge(verificationResult.riskLevel)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Trust Score:</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={verificationResult.verificationScore} className="h-2 w-20" />
                      <span className="text-sm font-medium">{verificationResult.verificationScore}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Client:</span>
                    <span className="text-sm">{verificationResult.clientInfo.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Email:</span>
                    <span className="text-sm">{verificationResult.clientInfo.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Activations:</span>
                    <span className="text-sm">
                      {verificationResult.currentActivations}/{verificationResult.restrictions.maxActivations}
                    </span>
                  </div>
                  {verificationResult.expiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Expires:</span>
                      <span className="text-sm">
                        {new Date(verificationResult.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Last Verified:</span>
                    <span className="text-sm">
                      {new Date(verificationResult.lastVerified).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}