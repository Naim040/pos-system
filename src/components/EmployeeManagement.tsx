"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { 
  Users, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  department?: string
  position?: string
  status: string
  hireDate?: string
  salary?: number
  hourlyRate?: number
  employeeId?: string
  totalHours?: number
  averageRating?: number
  lastClockIn?: string
  isClockedIn: boolean
}

interface TimeEntry {
  id: string
  userId: string
  userName: string
  clockIn: string
  clockOut?: string
  totalHours?: number
  overtimeHours?: number
  status: string
  notes?: string
}

interface PerformanceReview {
  id: string
  userId: string
  userName: string
  reviewerName: string
  reviewDate: string
  period: string
  rating: number
  status: string
  comments?: string
}

interface PayrollRecord {
  id: string
  userId: string
  userName: string
  period: string
  startDate: string
  endDate: string
  regularHours: number
  overtimeHours: number
  regularPay: number
  overtimePay: number
  netPay: number
  status: string
  paymentDate?: string
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([])
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()
  const { user, hasRole } = useAuth()

  useEffect(() => {
    loadEmployees()
    loadTimeEntries()
    loadPerformanceReviews()
    loadPayrollRecords()
  }, [])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      } else {
        // Mock data for demo
        setEmployees([
          {
            id: '1',
            name: 'John Smith',
            email: 'john@example.com',
            phone: '+1-555-0123',
            role: 'manager',
            department: 'Operations',
            position: 'Store Manager',
            status: 'active',
            hireDate: '2023-01-15',
            salary: 55000,
            employeeId: 'EMP001',
            totalHours: 1680,
            averageRating: 4.5,
            lastClockIn: '2024-01-15T09:00:00Z',
            isClockedIn: true
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '+1-555-0124',
            role: 'staff',
            department: 'Sales',
            position: 'Sales Associate',
            status: 'active',
            hireDate: '2023-03-20',
            hourlyRate: 18.50,
            employeeId: 'EMP002',
            totalHours: 1420,
            averageRating: 4.2,
            lastClockIn: '2024-01-15T08:30:00Z',
            isClockedIn: true
          },
          {
            id: '3',
            name: 'Mike Wilson',
            email: 'mike@example.com',
            phone: '+1-555-0125',
            role: 'staff',
            department: 'Sales',
            position: 'Cashier',
            status: 'active',
            hireDate: '2023-06-10',
            hourlyRate: 16.75,
            employeeId: 'EMP003',
            totalHours: 980,
            averageRating: 3.8,
            lastClockIn: null,
            isClockedIn: false
          }
        ])
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      })
    }
  }

  const loadTimeEntries = async () => {
    try {
      const response = await fetch('/api/time-entries')
      if (response.ok) {
        const data = await response.json()
        setTimeEntries(data)
      } else {
        // Mock data for demo
        setTimeEntries([
          {
            id: '1',
            userId: '1',
            userName: 'John Smith',
            clockIn: '2024-01-15T09:00:00Z',
            clockOut: '2024-01-15T17:30:00Z',
            totalHours: 8.5,
            overtimeHours: 0.5,
            status: 'completed',
            notes: 'Regular shift'
          },
          {
            id: '2',
            userId: '2',
            userName: 'Sarah Johnson',
            clockIn: '2024-01-15T08:30:00Z',
            totalHours: 0,
            status: 'active',
            notes: 'Currently working'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading time entries:', error)
    }
  }

  const loadPerformanceReviews = async () => {
    try {
      const response = await fetch('/api/performance-reviews')
      if (response.ok) {
        const data = await response.json()
        setPerformanceReviews(data)
      } else {
        // Mock data for demo
        setPerformanceReviews([
          {
            id: '1',
            userId: '1',
            userName: 'John Smith',
            reviewerName: 'Admin',
            reviewDate: '2024-01-10',
            period: 'quarterly',
            rating: 4.5,
            status: 'completed',
            comments: 'Excellent performance, great leadership skills'
          },
          {
            id: '2',
            userId: '2',
            userName: 'Sarah Johnson',
            reviewerName: 'John Smith',
            reviewDate: '2024-01-08',
            period: 'quarterly',
            rating: 4.2,
            status: 'completed',
            comments: 'Strong sales performance, good customer service'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading performance reviews:', error)
    }
  }

  const loadPayrollRecords = async () => {
    try {
      const response = await fetch('/api/payroll-records')
      if (response.ok) {
        const data = await response.json()
        setPayrollRecords(data)
      } else {
        // Mock data for demo
        setPayrollRecords([
          {
            id: '1',
            userId: '1',
            userName: 'John Smith',
            period: 'monthly',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            regularHours: 160,
            overtimeHours: 8,
            regularPay: 4583.33,
            overtimePay: 458.33,
            netPay: 4541.66,
            status: 'paid',
            paymentDate: '2024-01-31'
          },
          {
            id: '2',
            userId: '2',
            userName: 'Sarah Johnson',
            period: 'monthly',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            regularHours: 140,
            overtimeHours: 5,
            regularPay: 2590.00,
            overtimePay: 138.75,
            netPay: 2528.75,
            status: 'processed'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading payroll records:', error)
    }
  }

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'terminated':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`
  }

  const handleClockInOut = async (employeeId: string, action: 'clockIn' | 'clockOut') => {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: employeeId,
          action
        }),
      })

      if (response.ok) {
        await loadTimeEntries()
        await loadEmployees()
        toast({
          title: "Success",
          description: `Employee ${action === 'clockIn' ? 'clocked in' : 'clocked out'} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to ${action === 'clockIn' ? 'clock in' : 'clock out'} employee`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action === 'clockIn' ? 'clock in' : 'clock out'} employee`,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage employees, track time, and process payroll</p>
        </div>
        <div className="flex items-center space-x-4">
          {(hasRole('admin') || hasRole('manager')) && (
            <>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              {employees.filter(e => e.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Working</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.isClockedIn).length}</div>
            <p className="text-xs text-muted-foreground">
              Employees clocked in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.length > 0 
                ? (employees.reduce((sum, e) => sum + (e.averageRating || 0), 0) / employees.length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0 rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                payrollRecords
                  .filter(p => p.status === 'paid')
                  .reduce((sum, p) => sum + p.netPay, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Manage employee information and status</CardDescription>
              <div className="relative">
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{employee.name}</span>
                            <span className="text-sm text-gray-500">{employee.email}</span>
                            {employee.employeeId && (
                              <span className="text-xs text-gray-400">ID: {employee.employeeId}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.role}</Badge>
                        </TableCell>
                        <TableCell>{employee.department || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(employee.status)}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getRatingStars(employee.averageRating || 0)}
                            <span className="text-sm text-gray-600 ml-1">
                              {employee.averageRating?.toFixed(1) || '0.0'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatHours(employee.totalHours || 0)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {employee.isClockedIn ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClockInOut(employee.id, 'clockOut')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Pause className="h-4 w-4 mr-1" />
                                Clock Out
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClockInOut(employee.id, 'clockIn')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Clock In
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(hasRole('admin') || hasRole('manager')) && (
                              <>
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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

        {/* Time Tracking Tab */}
        <TabsContent value="time-tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
              <CardDescription>Employee work hours and attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{entry.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(entry.clockIn).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {entry.clockOut ? new Date(entry.clockOut).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>{formatHours(entry.totalHours || 0)}</TableCell>
                        <TableCell>{formatHours(entry.overtimeHours || 0)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            entry.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                            entry.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }>
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(hasRole('admin') || hasRole('manager')) && (
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
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

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
              <CardDescription>Employee performance evaluations and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{review.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{review.reviewerName}</TableCell>
                        <TableCell>
                          {new Date(review.reviewDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="capitalize">{review.period}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getRatingStars(review.rating)}
                            <span className="text-sm text-gray-600 ml-1">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            review.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            review.status === 'submitted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }>
                            {review.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(hasRole('admin') || hasRole('manager')) && (
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
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

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>Employee compensation and payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Regular Hours</TableHead>
                      <TableHead>Overtime Hours</TableHead>
                      <TableHead>Regular Pay</TableHead>
                      <TableHead>Overtime Pay</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{record.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{record.period}</TableCell>
                        <TableCell>{formatHours(record.regularHours)}</TableCell>
                        <TableCell>{formatHours(record.overtimeHours)}</TableCell>
                        <TableCell>{formatCurrency(record.regularPay)}</TableCell>
                        <TableCell>{formatCurrency(record.overtimePay)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(record.netPay)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            record.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                            record.status === 'processed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(hasRole('admin') || hasRole('manager')) && (
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
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
      </Tabs>
    </div>
  )
}