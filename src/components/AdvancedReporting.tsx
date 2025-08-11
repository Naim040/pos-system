"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Mail, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  FileSpreadsheet,
  File,
  Database,
  Lightbulb,
  Target,
  Users,
  Package,
  DollarSign,
  Brain,
  Search
} from 'lucide-react'

interface ReportSchedule {
  id: string
  name: string
  description?: string
  type: string
  frequency: string
  format: string
  config: string
  recipients: string
  isActive: boolean
  timezone: string
  nextRun?: string
  lastRun?: string
  createdAt: string
  updatedAt: string
  reportRuns: ReportRun[]
}

interface ReportRun {
  id: string
  status: string
  fileName?: string
  filePath?: string
  fileSize?: number
  downloadUrl?: string
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

interface ReportTemplate {
  id: string
  name: string
  description?: string
  category: string
  config: string
  isDefault: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

interface ReportExport {
  id: string
  name: string
  type: string
  format: string
  config: string
  filters?: string
  fileName?: string
  filePath?: string
  fileSize?: number
  downloadUrl?: string
  status: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

interface AutomatedInsight {
  id: string
  type: string
  category: string
  title: string
  description: string
  data?: string
  severity: string
  confidence: number
  isRead: boolean
  isResolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  actionTaken?: string
  createdAt: string
  updatedAt: string
  insightTargets: InsightTarget[]
}

interface InsightTarget {
  id: string
  targetType: string
  targetId: string
  metadata?: string
  createdAt: string
}

interface DataExport {
  id: string
  name: string
  type: string
  format: string
  filters?: string
  columns?: string
  dateRange?: string
  fileName?: string
  filePath?: string
  fileSize?: number
  downloadUrl?: string
  status: string
  errorMessage?: string
  progress: number
  createdAt: string
  updatedAt: string
}

export default function AdvancedReporting() {
  const [reportSchedules, setReportSchedules] = useState<ReportSchedule[]>([])
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [reportExports, setReportExports] = useState<ReportExport[]>([])
  const [automatedInsights, setAutomatedInsights] = useState<AutomatedInsight[]>([])
  const [dataExports, setDataExports] = useState<DataExport[]>([])
  const [loading, setLoading] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showQuickExportDialog, setShowQuickExportDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const { toast } = useToast()

  // Form states
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    type: 'sales',
    frequency: 'daily',
    format: 'pdf',
    config: '{}',
    recipients: '[]',
    isActive: true,
    timezone: 'UTC'
  })

  const [newExport, setNewExport] = useState({
    name: '',
    type: 'sales',
    format: 'csv',
    filters: '{}',
    columns: '[]',
    dateRange: '{}'
  })

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'sales',
    config: '{}',
    isDefault: false,
    isSystem: false
  })

  const [quickExport, setQuickExport] = useState({
    type: 'sales',
    format: 'csv',
    dateRange: 'last_7_days',
    includeCharts: false,
    emailReport: false,
    emailAddress: ''
  })

  // Quick export templates
  const quickExportTemplates = [
    {
      id: 'daily_sales',
      name: 'Daily Sales Summary',
      type: 'sales',
      format: 'pdf',
      description: 'Comprehensive daily sales report with charts',
      config: { includeCharts: true, groupBy: 'day' }
    },
    {
      id: 'inventory_snapshot',
      name: 'Inventory Snapshot',
      type: 'inventory',
      format: 'excel',
      description: 'Current inventory levels across all stores',
      config: { includeStores: true, includeLowStock: true }
    },
    {
      id: 'customer_analysis',
      name: 'Customer Analysis',
      type: 'customer',
      format: 'csv',
      description: 'Customer behavior and loyalty analysis',
      config: { includeLoyalty: true, includePurchaseHistory: true }
    },
    {
      id: 'financial_summary',
      name: 'Financial Summary',
      type: 'financial',
      format: 'pdf',
      description: 'Monthly financial performance report',
      config: { includeProfit: true, includeExpenses: true }
    }
  ]

  useEffect(() => {
    fetchReportSchedules()
    fetchReportTemplates()
    fetchReportExports()
    fetchAutomatedInsights()
    fetchDataExports()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchDataExports()
      fetchAutomatedInsights()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchReportSchedules = async () => {
    try {
      const response = await fetch('/api/report-schedules')
      if (response.ok) {
        const data = await response.json()
        setReportSchedules(data)
      }
    } catch (error) {
      console.error('Error fetching report schedules:', error)
    }
  }

  const fetchReportTemplates = async () => {
    try {
      const response = await fetch('/api/report-templates')
      if (response.ok) {
        const data = await response.json()
        setReportTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching report templates:', error)
    }
  }

  const fetchReportExports = async () => {
    try {
      const response = await fetch('/api/report-exports')
      if (response.ok) {
        const data = await response.json()
        setReportExports(data)
      }
    } catch (error) {
      console.error('Error fetching report exports:', error)
    }
  }

  const fetchAutomatedInsights = async () => {
    try {
      const response = await fetch('/api/automated-insights')
      if (response.ok) {
        const data = await response.json()
        setAutomatedInsights(data)
      }
    } catch (error) {
      console.error('Error fetching automated insights:', error)
    }
  }

  const fetchDataExports = async () => {
    try {
      const response = await fetch('/api/data-exports')
      if (response.ok) {
        const data = await response.json()
        setDataExports(data)
      }
    } catch (error) {
      console.error('Error fetching data exports:', error)
    }
  }

  const createReportSchedule = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/report-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSchedule),
      })

      if (response.ok) {
        await fetchReportSchedules()
        setShowScheduleDialog(false)
        setNewSchedule({
          name: '',
          description: '',
          type: 'sales',
          frequency: 'daily',
          format: 'pdf',
          config: '{}',
          recipients: '[]',
          isActive: true,
          timezone: 'UTC'
        })
        toast({
          title: "Success",
          description: "Report schedule created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create report schedule",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create report schedule",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createDataExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data-exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExport),
      })

      if (response.ok) {
        await fetchDataExports()
        setShowExportDialog(false)
        setNewExport({
          name: '',
          type: 'sales',
          format: 'csv',
          filters: '{}',
          columns: '[]',
          dateRange: '{}'
        })
        toast({
          title: "Success",
          description: "Data export started successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to start data export",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start data export",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createReportTemplate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/report-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate),
      })

      if (response.ok) {
        await fetchReportTemplates()
        setShowTemplateDialog(false)
        setNewTemplate({
          name: '',
          description: '',
          category: 'sales',
          config: '{}',
          isDefault: false,
          isSystem: false
        })
        toast({
          title: "Success",
          description: "Report template created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create report template",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create report template",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateInsightStatus = async (insightId: string, isResolved: boolean) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/automated-insights/${insightId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isResolved }),
      })

      if (response.ok) {
        await fetchAutomatedInsights()
        toast({
          title: "Success",
          description: `Insight ${isResolved ? 'resolved' : 'reopened'} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update insight status",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update insight status",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />
      case 'opportunity': return <Target className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'recommendation': return <Lightbulb className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return <DollarSign className="h-4 w-4" />
      case 'inventory': return <Package className="h-4 w-4" />
      case 'customer': return <Users className="h-4 w-4" />
      case 'employee': return <Users className="h-4 w-4" />
      case 'financial': return <DollarSign className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Filter functions
  const filteredReportSchedules = reportSchedules.filter(schedule => {
    const matchesSearch = schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || schedule.type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && schedule.isActive) ||
                         (statusFilter === 'inactive' && !schedule.isActive)
    return matchesSearch && matchesType && matchesStatus
  })

  const filteredDataExports = dataExports.filter(export_ => {
    const matchesSearch = export_.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || export_.type === typeFilter
    const matchesStatus = statusFilter === 'all' || export_.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const filteredAutomatedInsights = automatedInsights.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insight.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || insight.type === typeFilter
    const matchesCategory = typeFilter === 'all' || insight.category === typeFilter
    const matchesSeverity = statusFilter === 'all' || insight.severity === statusFilter
    const matchesResolved = statusFilter === 'all' || 
                          (statusFilter === 'resolved' && insight.isResolved) ||
                          (statusFilter === 'pending' && !insight.isResolved)
    return matchesSearch && (matchesType || matchesCategory) && matchesSeverity && matchesResolved
  })

  const filteredReportTemplates = reportTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = typeFilter === 'all' || template.category === typeFilter
    return matchesSearch && matchesCategory
  })

  // Quick export handler
  const handleQuickExport = async (templateId: string) => {
    const template = quickExportTemplates.find(t => t.id === templateId)
    if (!template) return

    setLoading(true)
    try {
      const response = await fetch('/api/data-exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: template.name,
          type: template.type,
          format: template.format,
          filters: JSON.stringify(template.config),
          dateRange: JSON.stringify({ range: 'last_7_days' })
        }),
      })

      if (response.ok) {
        await fetchDataExports()
        toast({
          title: "Export Started",
          description: `${template.name} export has been started and will be available shortly.`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to start quick export",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start quick export",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate AI-powered insights
  const generateAIInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/automated-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'recommendation',
          category: 'sales',
          title: 'AI-Powered Business Insights',
          description: 'Automated analysis of sales trends and opportunities',
          severity: 'medium',
          confidence: 0.9,
          insightTargets: []
        }),
      })

      if (response.ok) {
        await fetchAutomatedInsights()
        toast({
          title: "AI Insights Generated",
          description: "New AI-powered insights have been generated for your business.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to generate AI insights",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advanced Reporting</h1>
          <p className="text-gray-600">Schedule reports, export data, and view automated insights</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showQuickExportDialog} onOpenChange={setShowQuickExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Quick Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Quick Export Templates</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {quickExportTemplates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline">{template.type}</Badge>
                              <Badge variant="outline">{template.format.toUpperCase()}</Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleQuickExport(template.id)}
                            disabled={loading}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            onClick={generateAIInsights}
            disabled={loading}
          >
            <Brain className="h-4 w-4 mr-2" />
            Generate AI Insights
          </Button>
          
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Report Name</Label>
                    <Input
                      id="name"
                      value={newSchedule.name}
                      onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                      placeholder="Daily Sales Report"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Report Type</Label>
                    <Select value={newSchedule.type} onValueChange={(value) => setNewSchedule({ ...newSchedule, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    placeholder="Report description..."
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={newSchedule.frequency} onValueChange={(value) => setNewSchedule({ ...newSchedule, frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select value={newSchedule.format} onValueChange={(value) => setNewSchedule({ ...newSchedule, format: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="recipients">Recipients (JSON Array)</Label>
                  <Textarea
                    id="recipients"
                    value={newSchedule.recipients}
                    onChange={(e) => setNewSchedule({ ...newSchedule, recipients: e.target.value })}
                    placeholder='["email@example.com", "manager@example.com"]'
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newSchedule.isActive}
                    onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active Schedule</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createReportSchedule} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Schedule'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Export Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exportName">Export Name</Label>
                    <Input
                      id="exportName"
                      value={newExport.name}
                      onChange={(e) => setNewExport({ ...newExport, name: e.target.value })}
                      placeholder="Sales Data Export"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exportType">Data Type</Label>
                    <Select value={newExport.type} onValueChange={(value) => setNewExport({ ...newExport, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="products">Products</SelectItem>
                        <SelectItem value="stores">Stores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exportFormat">Format</Label>
                    <Select value={newExport.format} onValueChange={(value) => setNewExport({ ...newExport, format: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateRange">Date Range (JSON)</Label>
                    <Textarea
                      id="dateRange"
                      value={newExport.dateRange}
                      onChange={(e) => setNewExport({ ...newExport, dateRange: e.target.value })}
                      placeholder='{"start": "2024-01-01", "end": "2024-12-31"}'
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createDataExport} disabled={loading}>
                    {loading ? 'Starting...' : 'Start Export'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Report Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Sales Summary Template"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateCategory">Category</Label>
                    <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="templateDescription">Description</Label>
                  <Textarea
                    id="templateDescription"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Template description..."
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="templateConfig">Configuration (JSON)</Label>
                  <Textarea
                    id="templateConfig"
                    value={newTemplate.config}
                    onChange={(e) => setNewTemplate({ ...newTemplate, config: e.target.value })}
                    placeholder='{"charts": ["bar", "line"], "metrics": ["total_sales", "profit"]}'
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createReportTemplate} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Template'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtering and Search Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reports, exports, insights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('all')
                  setStatusFilter('all')
                  setDateRangeFilter('all')
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="schedules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedules">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="insights">Automated Insights</TabsTrigger>
          <TabsTrigger value="exports">Data Exports</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {filteredReportSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      {schedule.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={schedule.isActive ? "default" : "secondary"}>
                        {schedule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {schedule.frequency}
                      </Badge>
                      <Badge variant="outline">
                        {schedule.format.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {schedule.description && (
                    <p className="text-sm text-gray-600">{schedule.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Type</div>
                      <div className="font-medium capitalize">{schedule.type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Timezone</div>
                      <div className="font-medium">{schedule.timezone}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Last Run</div>
                      <div className="font-medium">
                        {schedule.lastRun ? new Date(schedule.lastRun).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Next Run</div>
                      <div className="font-medium">
                        {schedule.nextRun ? new Date(schedule.nextRun).toLocaleDateString() : 'Not scheduled'}
                      </div>
                    </div>
                  </div>
                  
                  {schedule.reportRuns.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Recent Runs</div>
                      <div className="space-y-2">
                        {schedule.reportRuns.slice(0, 3).map((run) => (
                          <div key={run.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(run.status)}>
                                {run.status}
                              </Badge>
                              <span className="text-sm">
                                {new Date(run.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {run.downloadUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadFile(run.downloadUrl!, run.fileName!)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              {run.fileSize && (
                                <span className="text-sm text-gray-600">
                                  {formatFileSize(run.fileSize)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {filteredAutomatedInsights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {getTypeIcon(insight.type)}
                      <span className="ml-2">{insight.title}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(insight.severity)}>
                        {insight.severity}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(insight.confidence * 100)}% confidence
                      </Badge>
                      <Button
                        size="sm"
                        variant={insight.isResolved ? "outline" : "default"}
                        onClick={() => updateInsightStatus(insight.id, !insight.isResolved)}
                      >
                        {insight.isResolved ? 'Reopen' : 'Resolve'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(insight.category)}
                      <span className="text-sm text-gray-600 capitalize">
                        {insight.category} • {insight.type}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700">{insight.description}</p>
                    
                    {insight.insightTargets.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Affected Items</div>
                        <div className="flex flex-wrap gap-2">
                          {insight.insightTargets.map((target) => (
                            <Badge key={target.id} variant="secondary">
                              {target.targetType}: {target.targetId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {insight.isResolved && (
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <div className="text-sm text-green-800">
                          <strong>Resolved:</strong> {insight.resolvedAt && new Date(insight.resolvedAt).toLocaleDateString()}
                          {insight.actionTaken && ` • Action: ${insight.actionTaken}`}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {filteredDataExports.map((export_) => (
              <Card key={export_.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      {export_.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(export_.status)}>
                        {export_.status}
                      </Badge>
                      <Badge variant="outline">
                        {export_.format.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {export_.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Created</div>
                        <div className="font-medium">
                          {new Date(export_.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">File Size</div>
                        <div className="font-medium">
                          {export_.fileSize ? formatFileSize(export_.fileSize) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Progress</div>
                        <div className="font-medium">
                          {export_.progress}%
                        </div>
                      </div>
                    </div>
                    
                    {export_.status === 'processing' && (
                      <Progress value={export_.progress} className="w-full" />
                    )}
                    
                    {export_.errorMessage && (
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <div className="text-sm text-red-800">
                          <strong>Error:</strong> {export_.errorMessage}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      {export_.downloadUrl && (
                        <Button
                          onClick={() => downloadFile(export_.downloadUrl!, export_.fileName!)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {export_.status === 'processing' && (
                        <Button variant="outline" disabled>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReportTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    {template.name}
                  </CardTitle>
                  {template.description && (
                    <p className="text-sm text-gray-600">{template.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Category</span>
                      <Badge variant="secondary" className="capitalize">
                        {template.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Type</span>
                      <div className="flex space-x-1">
                        {template.isDefault && (
                          <Badge variant="outline">Default</Badge>
                        )}
                        {template.isSystem && (
                          <Badge variant="outline">System</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Created</span>
                      <span className="text-sm">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm">
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Active Schedules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportSchedules.filter(s => s.isActive).length}
                </div>
                <div className="text-sm text-gray-600">
                  {reportSchedules.filter(s => s.isActive && s.nextRun).length} scheduled to run
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Pending Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {automatedInsights.filter(i => !i.isRead).length}
                </div>
                <div className="text-sm text-gray-600">
                  {automatedInsights.filter(i => i.severity === 'critical').length} critical
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Recent Exports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dataExports.filter(e => e.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">
                  {dataExports.filter(e => e.status === 'processing').length} processing
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Report Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportTemplates.length}
                </div>
                <div className="text-sm text-gray-600">
                  {reportTemplates.filter(t => t.isDefault).length} default templates
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {automatedInsights.slice(0, 5).map((insight) => (
                    <div key={insight.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(insight.type)}
                        <div>
                          <div className="font-medium text-sm">{insight.title}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(insight.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(insight.severity)}>
                        {insight.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Scheduled Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportSchedules
                    .filter(s => s.isActive && s.nextRun)
                    .slice(0, 5)
                    .map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium text-sm">{schedule.name}</div>
                          <div className="text-xs text-gray-600">
                            {schedule.nextRun && new Date(schedule.nextRun).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {schedule.frequency}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}