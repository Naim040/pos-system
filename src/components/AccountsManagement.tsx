"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { 
  Users, 
  Building, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Plus,
  Download,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface Account {
  id: string
  name: string
  type: string
  subtype?: string
  accountNumber?: string
  description?: string
  balance: number
  currency: string
  isActive: boolean
  store?: {
    id: string
    name: string
  }
}

interface CustomerLedgerEntry {
  id: string
  customerId: string
  type: string
  amount: number
  balance: number
  description?: string
  referenceId?: string
  date: string
  customer: {
    id: string
    name: string
    email?: string
    phone?: string
  }
}

interface SupplierLedgerEntry {
  id: string
  supplierId: string
  type: string
  amount: number
  balance: number
  description?: string
  referenceId?: string
  date: string
  supplier: {
    id: string
    name: string
    email?: string
    phone?: string
  }
}

interface Expense {
  id: string
  categoryId: string
  amount: number
  description: string
  date: string
  paymentMethod: string
  status: string
  receiptUrl?: string
  notes?: string
  category: {
    id: string
    name: string
  }
  store?: {
    id: string
    name: string
  }
  expenseItems: Array<{
    id: string
    description: string
    amount: number
    quantity: number
  }>
}

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountType: string
  balance: number
  currency: string
  isActive: boolean
  account: {
    id: string
    name: string
    type: string
    balance: number
    currency: string
  }
}

interface CashTransaction {
  id: string
  type: string
  amount: number
  description: string
  date: string
  balance: number
  store?: {
    id: string
    name: string
  }
}

interface DueReport {
  id: string
  type: string
  entityId: string
  entityName: string
  totalAmount: number
  paidAmount: number
  dueAmount: number
  dueDate?: string
  status: string
}

export default function AccountsManagement() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  
  // Data states
  const [accounts, setAccounts] = useState<Account[]>([])
  const [customerLedger, setCustomerLedger] = useState<CustomerLedgerEntry[]>([])
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerEntry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([])
  const [dueReports, setDueReports] = useState<DueReport[]>([])
  
  // Form states
  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showBankAccountDialog, setShowBankAccountDialog] = useState(false)
  
  // Summary calculations
  const totalReceivables = customerLedger.reduce((sum, entry) => 
    entry.type === 'sale' ? sum + entry.amount : sum, 0
  )
  const totalPayables = supplierLedger.reduce((sum, entry) => 
    entry.type === 'purchase' ? sum + entry.amount : sum, 0
  )
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalBankBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0)
  const cashBalance = cashTransactions.length > 0 ? 
    cashTransactions[cashTransactions.length - 1]?.balance || 0 : 0

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [accountsRes, customerLedgerRes, supplierLedgerRes, expensesRes, 
           bankAccountsRes, cashTransactionsRes, dueReportsRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/customer-ledger'),
        fetch('/api/supplier-ledger'),
        fetch('/api/expenses'),
        fetch('/api/bank-accounts'),
        fetch('/api/cash-transactions'),
        fetch('/api/due-reports')
      ])

      if (accountsRes.ok) setAccounts(await accountsRes.json())
      if (customerLedgerRes.ok) setCustomerLedger(await customerLedgerRes.json())
      if (supplierLedgerRes.ok) setSupplierLedger(await supplierLedgerRes.json())
      if (expensesRes.ok) setExpenses(await expensesRes.json())
      if (bankAccountsRes.ok) setBankAccounts(await bankAccountsRes.json())
      if (cashTransactionsRes.ok) setCashTransactions(await cashTransactionsRes.json())
      if (dueReportsRes.ok) setDueReports(await dueReportsRes.json())
    } catch (error) {
      console.error('Error loading accounts data:', error)
      toast({
        title: "Error",
        description: "Failed to load accounts data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: string = 'BDT') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceivables)}</div>
            <p className="text-xs text-muted-foreground">
              Money owed by customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayables)}</div>
            <p className="text-xs text-muted-foreground">
              Money owed to suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              This month's expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBankBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Total bank balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Due Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Customer Dues
            </CardTitle>
            <CardDescription>Outstanding customer payments</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueReports
                    .filter(report => report.type === 'receivable')
                    .slice(0, 5)
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.entityName}</TableCell>
                        <TableCell>{formatCurrency(report.dueAmount)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Supplier Dues
            </CardTitle>
            <CardDescription>Outstanding supplier payments</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueReports
                    .filter(report => report.type === 'payable')
                    .slice(0, 5)
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.entityName}</TableCell>
                        <TableCell>{formatCurrency(report.dueAmount)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCustomerLedger = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Customer Ledger</h3>
          <p className="text-sm text-gray-600">Track customer dues and payments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerLedger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{entry.customer.name}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'sale' ? 'default' : 'secondary'}>
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  const renderSupplierLedger = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Supplier Ledger</h3>
          <p className="text-sm text-gray-600">Track payable amounts and payments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierLedger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{entry.supplier.name}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'purchase' ? 'default' : 'secondary'}>
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  const renderExpenses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Daily Expenses</h3>
          <p className="text-sm text-gray-600">Track routine operational costs</p>
        </div>
        <Button onClick={() => setShowExpenseDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category.name}</TableCell>
                    <TableCell>{expense.paymentMethod}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  const renderBankAccounts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Bank Accounts</h3>
          <p className="text-sm text-gray-600">Manage bank accounts and transactions</p>
        </div>
        <Button onClick={() => setShowBankAccountDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle className="text-lg">{account.bankName}</CardTitle>
              <CardDescription>{account.accountType} - {account.accountNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Balance:</span>
                  <span className="font-semibold">{formatCurrency(account.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={account.isActive ? 'default' : 'secondary'}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderCashTransactions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Cash Transactions</h3>
          <p className="text-sm text-gray-600">In-shop daily cash income and expenses</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm">
            Current Balance: <span className="font-semibold">{formatCurrency(cashBalance)}</span>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  const renderDueReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Due Reports & Summary</h3>
          <p className="text-sm text-gray-600">Who owes how much and to whom we owe</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accounts Receivable</CardTitle>
            <CardDescription>Money owed by customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueReports
                    .filter(report => report.type === 'receivable')
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.entityName}</TableCell>
                        <TableCell>{formatCurrency(report.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(report.paidAmount)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(report.dueAmount)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accounts Payable</CardTitle>
            <CardDescription>Money owed to suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueReports
                    .filter(report => report.type === 'payable')
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.entityName}</TableCell>
                        <TableCell>{formatCurrency(report.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(report.paidAmount)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(report.dueAmount)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounts Management</h2>
          <p className="text-gray-600">Manage financial accounts, ledgers, and transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button onClick={loadData} disabled={loading}>
            <Calendar className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customer-ledger">Customer Ledger</TabsTrigger>
          <TabsTrigger value="supplier-ledger">Supplier Ledger</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="cash-transactions">Cash</TabsTrigger>
          <TabsTrigger value="due-reports">Due Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="customer-ledger">
          {renderCustomerLedger()}
        </TabsContent>

        <TabsContent value="supplier-ledger">
          {renderSupplierLedger()}
        </TabsContent>

        <TabsContent value="expenses">
          {renderExpenses()}
        </TabsContent>

        <TabsContent value="bank-accounts">
          {renderBankAccounts()}
        </TabsContent>

        <TabsContent value="cash-transactions">
          {renderCashTransactions()}
        </TabsContent>

        <TabsContent value="due-reports">
          {renderDueReports()}
        </TabsContent>
      </Tabs>
    </div>
  )
}