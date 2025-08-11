"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  DollarSign, 
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Receipt
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  dueBalance: number
  loyaltyPoints: number
  loyaltyTier: string
}

interface DuePayment {
  id: string
  customerId: string
  customer: Customer
  amount: number
  balance: number
  description: string
  referenceId?: string
  date: string
  createdAt: string
}

interface PaymentFormData {
  customerId: string
  amount: string
  paymentMethod: 'cash' | 'card' | 'bank_transfer'
  description: string
}

export default function ReceiveDuePayments() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [duePayments, setDuePayments] = useState<DuePayment[]>([])
  const [filteredDuePayments, setFilteredDuePayments] = useState<DuePayment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PaymentFormData>({
    customerId: '',
    amount: '',
    paymentMethod: 'cash',
    description: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadCustomers()
    loadDuePayments()
  }, [])

  useEffect(() => {
    filterDuePayments()
  }, [duePayments, searchTerm, selectedCustomer])

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        // Filter customers with due balance
        const customersWithDue = data.filter((customer: Customer) => customer.dueBalance > 0)
        setCustomers(customersWithDue)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadDuePayments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/due-payments')
      if (response.ok) {
        const data = await response.json()
        setDuePayments(data)
      } else {
        throw new Error('Failed to load due payments')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load due payments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterDuePayments = () => {
    let filtered = duePayments

    if (selectedCustomer && selectedCustomer !== 'all') {
      filtered = filtered.filter(payment => payment.customerId === selectedCustomer)
    }

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredDuePayments(filtered)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required'
    }

    if (!formData.amount || !formData.amount.trim()) {
      newErrors.amount = 'Payment amount is required'
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0'
      } else {
        // Check if amount exceeds customer's due balance
        const customer = customers.find(c => c.id === formData.customerId)
        if (customer && amount > customer.dueBalance) {
          newErrors.amount = `Amount cannot exceed customer's due balance of ${formatPrice(customer.dueBalance)}`
        }
      }
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/due-payments/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          description: formData.description || `Payment received`
        }),
      })

      if (response.ok) {
        const paymentData = await response.json()
        
        toast({
          title: "Payment received",
          description: `Payment of ${formatPrice(parseFloat(formData.amount))} received successfully`,
        })
        
        resetForm()
        setIsDialogOpen(false)
        loadCustomers() // Refresh customer balances
        loadDuePayments() // Refresh due payments
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to process payment')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customerId: '',
      amount: '',
      paymentMethod: 'cash',
      description: ''
    })
    setErrors({})
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    setIsDialogOpen(open)
  }

  const getTotalDueAmount = () => {
    return customers.reduce((total, customer) => total + customer.dueBalance, 0)
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    return customer?.name || 'Unknown Customer'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Receive Due Payments</h2>
          <p className="text-gray-600">Manage and collect customer due payments</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Due Amount</div>
            <div className="text-xl font-bold text-red-600">{formatPrice(getTotalDueAmount())}</div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <DollarSign className="h-4 w-4 mr-2" />
                Receive Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Receive Due Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select 
                    value={formData.customerId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                  >
                    <SelectTrigger className={errors.customerId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{customer.name}</span>
                            <span className="text-sm text-red-600 ml-2">{formatPrice(customer.dueBalance)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customerId && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="amount">Payment Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(value: 'cash' | 'card' | 'bank_transfer') => 
                      setFormData(prev => ({ ...prev, paymentMethod: value }))
                    }
                  >
                    <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter payment description (optional)"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Receive Payment'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({formatPrice(customer.dueBalance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="px-3 py-1">
              {filteredDuePayments.length} due payments
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Customers with Due Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <Card key={customer.id} className="relative hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                </div>
                <Badge variant={customer.dueBalance > 100 ? 'destructive' : 'secondary'}>
                  {formatPrice(customer.dueBalance)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Loyalty Tier</span>
                <Badge variant="outline" className="capitalize">
                  {customer.loyaltyTier}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Loyalty Points</span>
                <span>{customer.loyaltyPoints}</span>
              </div>
              {customer.email && (
                <div className="text-sm text-gray-500">
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="text-sm text-gray-500">
                  {customer.phone}
                </div>
              )}
              
              <Button
                className="w-full"
                onClick={() => {
                  setFormData(prev => ({ 
                    ...prev, 
                    customerId: customer.id,
                    amount: customer.dueBalance.toString()
                  }))
                  setIsDialogOpen(true)
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Receive Payment
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {customers.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Due Payments
              </h3>
              <p className="text-gray-500">
                All customers have paid their dues. Great job!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Payments History */}
      {filteredDuePayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Due Payments History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {filteredDuePayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{getCustomerName(payment.customerId)}</span>
                        <Badge variant="outline">{payment.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{payment.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(payment.date).toLocaleDateString()}
                        </span>
                        <span>Balance: {formatPrice(payment.balance)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">{formatPrice(payment.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}