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
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { useSocket } from '@/hooks/useSocket'
import { useNavigationLayout } from '@/hooks/useNavigationLayout'
import SidebarNavigation from '@/components/SidebarNavigation'
import { 
  Search, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Settings, 
  Box, 
  TrendingUp, 
  Users, 
  LogOut, 
  Receipt, 
  Building, 
  User, 
  Brain, 
  Store, 
  FileText, 
  Printer, 
  Gift,
  Calculator,
  Key,
  Mail,
  Download,
  Eye,
  Truck,
  RefreshCw,
  Percent,
  Tag,
  Smartphone,
  Star,
  ChevronDown,
  PackageCheck,
  AlertTriangle,
  Info
} from 'lucide-react'
import ProductManagement from '@/components/ProductManagement'
import CategoryManagement from '@/components/CategoryManagement'

import ProductReturnManagement from '@/components/ProductReturnManagement'
import ReturnReports from '@/components/ReturnReports'
import ReceiveDuePayments from '@/components/ReceiveDuePayments'
import SalesHistory from '@/components/SalesHistory'
import SalesReports from '@/components/SalesReports'
import UserManagement from '@/components/UserManagement'
import CustomerManagement from '@/components/CustomerManagement'
import EnhancedAnalyticsDashboard from '@/components/EnhancedAnalyticsDashboard'
import EmployeeManagement from '@/components/EmployeeManagement'
import EnhancedBarcodeScanner from '@/components/EnhancedBarcodeScanner'
import ReceiptComponent from '@/components/ReceiptComponent'
import BillPrinterManagement from '@/components/BillPrinterManagement'
import BillPrinterService from '@/components/BillPrinterService'
import MultiStoreManagement from '@/components/MultiStoreManagement'
import AdvancedReporting from '@/components/AdvancedReporting'
import SettingsManagement from '@/components/SettingsManagement'
import EnhancedCustomerLoyaltyProgram from '@/components/EnhancedCustomerLoyaltyProgram'
import AccountsManagement from '@/components/AccountsManagement'
import InvoiceManagement from '@/components/InvoiceManagement'
import EnhancedLicenseManagement from '@/components/EnhancedLicenseManagement'
import FranchiseManagement from '@/components/FranchiseManagement'
import FranchiseDashboard from '@/components/FranchiseDashboard'
import AttributeManagement from '@/components/AttributeManagement'
import ProductVariationsManagement from '@/components/ProductVariationsManagement'
import DeliveryManagement from '@/components/DeliveryManagement'
import EcommerceManagement from '@/components/EcommerceManagement'
import EnhancedInventoryManagement from '@/components/EnhancedInventoryManagement'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku?: string
  barcode?: string
  imageUrl?: string
  category?: {
    id: string
    name: string
  }
  stock?: number
  minStock?: number
  maxStock?: number
}

interface CartItem {
  product: Product
  quantity: number
  totalPrice: number
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  loyaltyPoints: number
  loyaltyTier: string
}

interface NavigationLayoutProps {
  products: Product[]
  cart: CartItem[]
  customers: Customer[]
  selectedCustomer: Customer | null
  redeemPoints: number
  pointsDiscount: number
  searchTerm: string
  customerSearchTerm: string
  loading: boolean
  showReceipt: boolean
  lastSale: any
  autoPrintEnabled: boolean
  setAutoPrintEnabled: (enabled: boolean) => void
  socket: any
  cartTotal: number
  cartCount: number
  
  // Handlers
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, newQuantity: number) => void
  setSelectedCustomer: (customer: Customer | null) => void
  setSearchTerm: (term: string) => void
  setCustomerSearchTerm: (term: string) => void
  handlePointsRedeem: (points: number) => void
  clearPointsRedemption: () => void
  handleCheckout: (paymentMethod: 'cash' | 'card' | 'due') => void
  setShowReceipt: (show: boolean) => void
  setLastSale: (sale: any) => void
  handleLogout: () => void
  fetchProducts: () => void
}

export default function NavigationLayout({
  products,
  cart,
  customers,
  selectedCustomer,
  redeemPoints,
  pointsDiscount,
  searchTerm,
  customerSearchTerm,
  loading,
  showReceipt,
  lastSale,
  autoPrintEnabled,
  setAutoPrintEnabled,
  socket,
  cartTotal,
  cartCount,
  
  // Handlers
  addToCart,
  removeFromCart,
  updateQuantity,
  setSelectedCustomer,
  setSearchTerm,
  setCustomerSearchTerm,
  handlePointsRedeem,
  clearPointsRedemption,
  handleCheckout,
  setShowReceipt,
  setLastSale,
  handleLogout,
  fetchProducts
}: NavigationLayoutProps) {
  const [activeTab, setActiveTab] = useState('pos')
  const [documentType, setDocumentType] = useState<'receipt' | 'invoice'>('receipt')
  const { user, hasRole, isFranchise } = useAuth()
  const { layout, isSidebarCollapsed, toggleSidebarCollapse } = useNavigationLayout()
  const { toast } = useToast()
  
  // Discount state
  const [showDiscountOptions, setShowDiscountOptions] = useState(false)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'coupon'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [couponCode, setCouponCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split' | 'mobile'>('cash')
  const [splitPaymentAmount, setSplitPaymentAmount] = useState({
    cash: 0,
    card: 0
  })
  
  // Popular products state
  const [showPopularProducts, setShowPopularProducts] = useState(false)
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  
  // Quick add customer state
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  })

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.includes(customerSearchTerm)
  )

  // Load popular products (mock data for demo)
  useEffect(() => {
    // In a real implementation, this would fetch from an API
    const mockPopularProducts = products
      .sort((a, b) => (b.price * 1.2) - (a.price * 1.2)) // Sort by price as a proxy for popularity
      .slice(0, 8) // Top 8 products
    
    setPopularProducts(mockPopularProducts)
  }, [products])

  // Quick add customer functions
  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a customer name",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCustomer.name.trim(),
          email: newCustomer.email.trim() || null,
          phone: newCustomer.phone.trim() || null,
          company: newCustomer.company.trim() || null,
          loyaltyPoints: 0,
          loyaltyTier: 'Bronze',
          totalSpent: 0,
          dueBalance: 0,
          visitCount: 0
        }),
      })

      if (response.ok) {
        const createdCustomer = await response.json()
        setSelectedCustomer(createdCustomer)
        setNewCustomer({ name: '', email: '', phone: '', company: '' })
        setShowAddCustomer(false)
        setCustomerSearchTerm('')
        
        // Refresh customers list
        const customersResponse = await fetch('/api/customers')
        if (customersResponse.ok) {
          const updatedCustomers = await customersResponse.json()
          // This would normally update the customers state, but we don't have direct access to setCustomers here
          // In a real implementation, we'd lift this state up or use a context
        }
        
        toast({
          title: "Customer Added",
          description: `${createdCustomer.name} has been added successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add customer",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Discount calculation functions
  const calculateDiscount = () => {
    if (discountType === 'percentage') {
      return cartTotal * (discountValue / 100)
    } else if (discountType === 'fixed') {
      return Math.min(discountValue, cartTotal)
    } else if (discountType === 'coupon') {
      // For demo, we'll simulate coupon validation
      if (couponCode.toUpperCase() === 'WELCOME10') {
        return cartTotal * 0.10
      } else if (couponCode.toUpperCase() === 'SAVE20') {
        return cartTotal * 0.20
      }
    }
    return 0
  }

  const applyDiscount = () => {
    const calculatedDiscount = calculateDiscount()
    setDiscountAmount(calculatedDiscount)
    
    if (calculatedDiscount > 0) {
      toast({
        title: "Discount Applied",
        description: `${discountType === 'coupon' ? 'Coupon' : 'Discount'} of ${formatPrice(calculatedDiscount)} applied`,
      })
    } else {
      toast({
        title: "Invalid Discount",
        description: "Please check your discount values or coupon code",
        variant: "destructive"
      })
    }
  }

  const clearDiscount = () => {
    setDiscountAmount(0)
    setDiscountValue(0)
    setCouponCode('')
    setDiscountType('percentage')
    setShowDiscountOptions(false)
    toast({
      title: "Discount Removed",
      description: "All discounts have been cleared",
    })
  }

  // Calculate final total with all discounts
  const subtotal = cartTotal
  const tax = subtotal * 0.08
  const totalDiscount = discountAmount + pointsDiscount
  const finalTotal = Math.max(0, subtotal + tax - totalDiscount)

  // Payment handling functions
  const openPaymentModal = () => {
    setShowPaymentModal(true)
    setPaymentMethod('cash')
    setSplitPaymentAmount({
      cash: finalTotal,
      card: 0
    })
  }

  const handleSplitPaymentChange = (type: 'cash' | 'card', value: number) => {
    const otherType = type === 'cash' ? 'card' : 'cash'
    const remainingAmount = finalTotal - value
    
    setSplitPaymentAmount(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(value, finalTotal)),
      [otherType]: Math.max(0, remainingAmount)
    }))
  }

  const processPayment = () => {
    if (paymentMethod === 'split') {
      const totalPaid = splitPaymentAmount.cash + splitPaymentAmount.card
      if (Math.abs(totalPaid - finalTotal) > 0.01) {
        toast({
          title: "Payment Error",
          description: "Split payment amounts must equal the total amount",
          variant: "destructive"
        })
        return
      }
      handleCheckout('split')
    } else {
      handleCheckout(paymentMethod)
    }
    setShowPaymentModal(false)
  }

  // Handler functions for receipt/invoice actions
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${documentType === 'invoice' ? 'Invoice' : 'Receipt'} #${lastSale.id.slice(-8)}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                margin: 0; 
                padding: 20px; 
                font-size: 12px;
                line-height: 1.6;
                color: #374151;
                background: #f9fafb;
              }
              
              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              
              .invoice-header {
                background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
                color: white;
                padding: 2rem;
                text-align: center;
              }
              
              .invoice-header h1 {
                font-size: 2rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
              }
              
              .invoice-header .invoice-number {
                font-size: 1.1rem;
                opacity: 0.9;
              }
              
              @media print {
                body { 
                  background: white; 
                  padding: 0;
                }
                
                .invoice-container {
                  box-shadow: none;
                  border-radius: 0;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
        printWindow.close()
        
        toast({
          title: `${documentType === 'invoice' ? 'Invoice' : 'Receipt'} sent to printer`,
          description: `${documentType === 'invoice' ? 'Invoice' : 'Receipt'} has been sent to your printer`,
        })
      }
    }
  }

  const handleDownload = () => {
    const receiptElement = document.getElementById('receipt-content')
    if (receiptElement) {
      const receiptHTML = receiptElement.innerHTML
      
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${documentType === 'invoice' ? 'Invoice' : 'Receipt'} #${lastSale.id.slice(-8)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              margin: 0; 
              padding: 20px; 
              font-size: 12px;
              line-height: 1.6;
              color: #374151;
              background: #f9fafb;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            
            .invoice-header {
              background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
              color: white;
              padding: 2rem;
              text-align: center;
            }
            
            .invoice-header h1 {
              font-size: 2rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
            }
            
            .invoice-header .invoice-number {
              font-size: 1.1rem;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          ${receiptHTML}
        </body>
        </html>
      `], { type: 'text/html' })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${documentType === 'invoice' ? 'invoice' : 'receipt'}-${lastSale.id.slice(-8)}.html`
      a.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: `${documentType === 'invoice' ? 'Invoice' : 'Receipt'} downloaded`,
        description: `${documentType === 'invoice' ? 'Invoice' : 'Receipt'} has been downloaded as HTML file`,
      })
    }
  }

  const handleEmail = () => {
    if (!lastSale.customerEmail) {
      toast({
        title: "No email address",
        description: "Customer email is required to send receipt/invoice",
        variant: "destructive"
      })
      return
    }

    const receiptElement = document.getElementById('receipt-content')
    if (receiptElement) {
      const receiptHTML = receiptElement.innerHTML
      
      const subject = `${documentType === 'invoice' ? 'Invoice' : 'Receipt'} #${lastSale.id.slice(-8)} from Your Business Name`
      const body = `
        Dear ${lastSale.customerName || 'Valued Customer'},
        
        Thank you for your business!
        
        Your ${documentType === 'invoice' ? 'invoice' : 'receipt'} is available below.
        
        ${documentType === 'invoice' ? 'Invoice' : 'Receipt'} ID: ${lastSale.id.slice(-8)}
        Date: ${new Date(lastSale.createdAt).toLocaleDateString()}
        Total: ${formatPrice(lastSale.totalAmount + lastSale.taxAmount - (lastSale.discount || 0))}
        
        ${documentType === 'invoice' ? 'Payment terms: Due within 30 days' : 'Thank you for your purchase!'}
        
        Best regards,
        Your Business Name
        +880 1234-567890
        info@yourbusiness.com
      `

      // Create mailto link
      const mailtoLink = `mailto:${lastSale.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      // Open email client
      window.open(mailtoLink, '_blank')
      
      toast({
        title: "Email client opened",
        description: "Please send the email from your email client",
      })
    }
  }

  const handleRefresh = () => {
    // Clear any temporary data if needed
    setSearchTerm('')
    setCustomerSearchTerm('')
    setSelectedCustomer(null)
    clearPointsRedemption()
    
    // Show loading state
    toast({
      title: "Refreshing...",
      description: "Loading fresh data from server",
    })
    
    // Refresh data from API/database
    fetchProducts()
    
    // If we're on a specific tab, we might need to refresh other data too
    // For now, we'll just reload the current page content
    setTimeout(() => {
      toast({
        title: "Refreshed",
        description: "Data has been updated successfully",
      })
    }, 500)
  }

  const renderPOSContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barcode Scanner */}
          <EnhancedBarcodeScanner
            onProductFound={addToCart}
            enabled={true}
            compact={true}
            className="mb-4"
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Products
                </div>
                <Drawer open={showPopularProducts} onOpenChange={setShowPopularProducts}>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-yellow-500 hover:text-yellow-600">
                      <Star className="h-4 w-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="w-[400px] sm:w-[540px]">
                    <DrawerHeader>
                      <DrawerTitle className="flex items-center">
                        <Star className="h-5 w-5 mr-2 text-yellow-500" />
                        Popular Products
                      </DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4">
                      <ScrollArea className="h-[400px]">
                        <div className="grid grid-cols-1 gap-3">
                          {popularProducts.map((product) => (
                            <Card
                              key={product.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => {
                                addToCart(product)
                                setShowPopularProducts(false)
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{product.name}</h4>
                                    {product.description && (
                                      <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                                    )}
                                    {product.category && (
                                      <Badge variant="secondary" className="text-xs mt-1">
                                        {product.category.name}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline" className="text-sm">
                                      {formatPrice(product.price)}
                                    </Badge>
                                    <div className="flex items-center mt-1">
                                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                      <span className="text-xs text-gray-500">Popular</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </DrawerContent>
                </Drawer>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => {
                    // Determine stock status
                    const stockStatus = product.stock !== undefined ? 
                      (product.stock <= 0 ? 'out' : 
                       product.stock <= (product.minStock || 5) ? 'low' : 'in') : 'unknown'
                    
                    const getStockBadge = () => {
                      switch (stockStatus) {
                        case 'out':
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Out of Stock
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This product is currently out of stock</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        case 'low':
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                    <PackageCheck className="h-3 w-3 mr-1" />
                                    {product.stock} left
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Low stock: {product.stock} remaining</p>
                                  {product.minStock && <p>Reorder at: {product.minStock}</p>}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        case 'in':
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    <PackageCheck className="h-3 w-3 mr-1" />
                                    {product.stock} in stock
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>In stock: {product.stock} available</p>
                                  {product.minStock && <p>Reorder point: {product.minStock}</p>}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        default:
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs">
                                    <Info className="h-3 w-3 mr-1" />
                                    Stock unknown
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Stock information not available</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                      }
                    }
                    
                    return (
                      <Card
                        key={product.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${stockStatus === 'out' ? 'opacity-50' : ''}`}
                        onClick={() => {
                          if (stockStatus !== 'out') {
                            addToCart(product)
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-sm">{product.name}</h3>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline">{formatPrice(product.price)}</Badge>
                              {getStockBadge()}
                            </div>
                          </div>
                        {product.description && (
                          <p className="text-xs text-gray-600 mb-2">{product.description}</p>
                        )}
                        {product.category && (
                          <Badge variant="secondary" className="text-xs">
                            {product.category.name}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Shopping Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Customer Selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Customer</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddCustomer(true)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New
                    </Button>
                    {selectedCustomer && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCustomer(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                
                {selectedCustomer ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{selectedCustomer.name}</p>
                        {selectedCustomer.email && (
                          <p className="text-xs text-gray-600">{selectedCustomer.email}</p>
                        )}
                        <div className="flex items-center mt-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="secondary" size="sm" className="text-xs h-auto py-1 px-2">
                                <Gift className="h-3 w-3 mr-1" />
                                Points: {selectedCustomer.loyaltyPoints}
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">Loyalty Points</h4>
                                  <Badge variant="outline">{selectedCustomer.loyaltyTier}</Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Available Points:</span>
                                    <span className="font-medium">{selectedCustomer.loyaltyPoints}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Points Value:</span>
                                    <span className="font-medium">{formatPrice(selectedCustomer.loyaltyPoints / 10)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Tier:</span>
                                    <span className="font-medium">{selectedCustomer.loyaltyTier}</span>
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Quick Redeem</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePointsRedeem(Math.min(100, selectedCustomer.loyaltyPoints))}
                                      disabled={selectedCustomer.loyaltyPoints < 100}
                                    >
                                      100 pts
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePointsRedeem(Math.min(250, selectedCustomer.loyaltyPoints))}
                                      disabled={selectedCustomer.loyaltyPoints < 250}
                                    >
                                      250 pts
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePointsRedeem(Math.min(500, selectedCustomer.loyaltyPoints))}
                                      disabled={selectedCustomer.loyaltyPoints < 500}
                                    >
                                      500 pts
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePointsRedeem(selectedCustomer.loyaltyPoints)}
                                    >
                                      Max
                                    </Button>
                                  </div>
                                </div>
                                
                                {pointsDiscount > 0 && (
                                  <div className="bg-green-50 p-2 rounded-md">
                                    <p className="text-sm text-green-700">
                                      ✓ {redeemPoints} points redeemed for {formatPrice(pointsDiscount)} discount
                                    </p>
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Search customers..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    />
                    {customerSearchTerm && (
                      <ScrollArea className="h-40 border rounded-md">
                        {filteredCustomers.length > 0 ? (
                          <div className="p-2 space-y-1">
                            {filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setCustomerSearchTerm('')
                                }}
                              >
                                <p className="font-medium text-sm">{customer.name}</p>
                                {customer.email && (
                                  <p className="text-xs text-gray-600">{customer.email}</p>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {customer.loyaltyTier} - {customer.loyaltyPoints} pts
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No customers found
                          </div>
                        )}
                      </ScrollArea>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div className="space-y-2 mb-4">
                <ScrollArea className="h-64">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-3 flex-1">
                            {/* Product Thumbnail */}
                            <div className="flex-shrink-0">
                              {item.product.imageUrl ? (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-10 h-10 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              {!item.product.imageUrl && (
                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center hidden">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                              <p className="text-xs text-gray-600">{formatPrice(item.product.price)} each</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Points Redemption */}
              {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Redeem Points</Label>
                    {redeemPoints > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearPointsRedemption}
                        className="text-red-500 hover:text-red-700"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Points to redeem"
                      value={redeemPoints || ''}
                      onChange={(e) => handlePointsRedeem(parseInt(e.target.value) || 0)}
                      max={selectedCustomer.loyaltyPoints}
                      min={0}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handlePointsRedeem(selectedCustomer.loyaltyPoints)}
                      disabled={redeemPoints >= selectedCustomer.loyaltyPoints}
                    >
                      Max
                    </Button>
                  </div>
                  {pointsDiscount > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Discount: {formatPrice(pointsDiscount)}
                    </p>
                  )}
                </div>
              )}

              {/* Cart Summary */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (8%):</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Points Discount:</span>
                    <span>-{formatPrice(pointsDiscount)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
                
                {/* Add Discount Link */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowDiscountOptions(!showDiscountOptions)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    {showDiscountOptions ? 'Hide Discount Options' : 'Add Discount'}
                  </button>
                </div>
                
                {/* Discount Options */}
                {showDiscountOptions && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Discount Type</Label>
                      <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed' | 'coupon') => setDiscountType(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                          <SelectItem value="coupon">Coupon Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {discountType === 'percentage' && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          max="100"
                          value={discountValue || ''}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    )}
                    
                    {discountType === 'fixed' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">$</span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={discountValue || ''}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          className="flex-1"
                        />
                      </div>
                    )}
                    
                    {discountType === 'coupon' && (
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1"
                        />
                        <Tag className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={applyDiscount}
                        disabled={(discountType !== 'coupon' && discountValue <= 0) || (discountType === 'coupon' && !couponCode.trim())}
                        className="flex-1"
                      >
                        Apply Discount
                      </Button>
                      {discountAmount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={clearDiscount}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    {/* Demo coupon info */}
                    {discountType === 'coupon' && (
                      <div className="text-xs text-gray-500">
                        Demo coupons: WELCOME10 (10%), SAVE20 (20%)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <div className="space-y-2">
                <Button
                  className="w-full relative"
                  onClick={openPaymentModal}
                  disabled={loading || cart.length === 0}
                  size="lg"
                >
                  {loading && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 rounded-md flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  )}
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {finalTotal > 0 ? formatPrice(finalTotal) : ''}
                </Button>
                
                {/* Due Payment Button (only show if customer is selected) */}
                {selectedCustomer && (
                  <Button
                    variant="outline"
                    className="w-full relative h-auto py-3"
                    onClick={() => {
                      console.log('Due payment button clicked')
                      console.log('Loading:', loading)
                      console.log('Cart length:', cart.length)
                      console.log('Selected customer:', selectedCustomer)
                      handleCheckout('due')
                    }}
                    disabled={loading || cart.length === 0}
                    title={cart.length === 0 ? "Add items to cart first" : loading ? "Processing..." : "Process due payment"}
                  >
                    {loading && (
                      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-md flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className="flex items-center justify-center">
                        <span className="mr-2">🕗</span>
                        <span>Due Payment / Pay Later</span>
                      </div>
                      {cart.length === 0 && (
                        <span className="text-xs text-gray-500 mt-1">(Cart empty)</span>
                      )}
                      {!selectedCustomer && cart.length > 0 && (
                        <span className="text-xs text-gray-500 mt-1">(Select customer)</span>
                      )}
                    </div>
                  </Button>
                )}
              </div>

              {/* Payment Modal */}
              <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment - {formatPrice(finalTotal)}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="cash">Cash</TabsTrigger>
                      <TabsTrigger value="card">Card</TabsTrigger>
                      <TabsTrigger value="split">Split</TabsTrigger>
                      <TabsTrigger value="mobile">Mobile</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="cash" className="space-y-4">
                      <div className="text-center py-4">
                        <DollarSign className="h-12 w-12 mx-auto mb-2 text-green-600" />
                        <p className="text-lg font-medium">Cash Payment</p>
                        <p className="text-sm text-gray-600">Customer will pay with cash</p>
                        <p className="text-lg font-bold mt-2">{formatPrice(finalTotal)}</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="card" className="space-y-4">
                      <div className="text-center py-4">
                        <CreditCard className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                        <p className="text-lg font-medium">Card Payment</p>
                        <p className="text-sm text-gray-600">Customer will pay with card</p>
                        <p className="text-lg font-bold mt-2">{formatPrice(finalTotal)}</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="split" className="space-y-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-lg font-medium">Split Payment</p>
                          <p className="text-sm text-gray-600">Customer will pay with both cash and card</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              Cash Amount
                            </Label>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={finalTotal}
                                value={splitPaymentAmount.cash}
                                onChange={(e) => handleSplitPaymentChange('cash', parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center">
                              <CreditCard className="h-4 w-4 mr-1" />
                              Card Amount
                            </Label>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={finalTotal}
                                value={splitPaymentAmount.card}
                                onChange={(e) => handleSplitPaymentChange('card', parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between font-medium">
                            <span>Total Paid:</span>
                            <span>{formatPrice(splitPaymentAmount.cash + splitPaymentAmount.card)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between font-medium">
                            <span>Remaining:</span>
                            <span className={Math.abs(finalTotal - (splitPaymentAmount.cash + splitPaymentAmount.card)) > 0.01 ? 'text-red-600' : 'text-green-600'}>
                              {formatPrice(finalTotal - (splitPaymentAmount.cash + splitPaymentAmount.card))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="mobile" className="space-y-4">
                      <div className="text-center py-4">
                        <Smartphone className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                        <p className="text-lg font-medium">Mobile Payment</p>
                        <p className="text-sm text-gray-600">Apple Pay, Google Pay, bKash, etc.</p>
                        <p className="text-lg font-bold mt-2">{formatPrice(finalTotal)}</p>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            🔒 Secure payment processing
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Supported Payment Methods:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center p-2 border rounded-lg">
                            <div className="w-8 h-8 bg-black rounded flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">A</span>
                            </div>
                            <span className="text-sm">Apple Pay</span>
                          </div>
                          <div className="flex items-center p-2 border rounded-lg">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">G</span>
                            </div>
                            <span className="text-sm">Google Pay</span>
                          </div>
                          <div className="flex items-center p-2 border rounded-lg">
                            <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">b</span>
                            </div>
                            <span className="text-sm">bKash</span>
                          </div>
                          <div className="flex items-center p-2 border rounded-lg opacity-50">
                            <div className="w-8 h-8 bg-gray-400 rounded flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">+</span>
                            </div>
                            <span className="text-sm">More</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                          💡 Mobile payments will be available in the next update
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={processPayment}
                      disabled={paymentMethod === 'mobile' || (paymentMethod === 'split' && Math.abs(finalTotal - (splitPaymentAmount.cash + splitPaymentAmount.card)) > 0.01)}
                      className="flex-1"
                    >
                      Process Payment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Customer Modal */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="Enter email address"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                placeholder="Enter phone number"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerCompany">Company</Label>
              <Input
                id="customerCompany"
                placeholder="Enter company name"
                value={newCustomer.company}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, company: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCustomer(false)
                  setNewCustomer({ name: '', email: '', phone: '', company: '' })
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomer}
                disabled={!newCustomer.name.trim()}
                className="flex-1"
              >
                Add Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  const renderContent = () => {
    // If user is franchise, show franchise dashboard instead of POS
    if (isFranchise() && activeTab === 'pos') {
      return <FranchiseDashboard />
    }
    
    switch (activeTab) {
      case 'pos':
        return renderPOSContent()
      case 'products':
        return <ProductManagement />
      case 'attributes':
        return <AttributeManagement />
      case 'variations':
        return <ProductVariationsManagement />
      case 'categories':
        return <CategoryManagement />
      case 'ecommerce':
        return <EcommerceManagement />
      case 'inventory':
        return <EnhancedInventoryManagement />
      case 'sales':
        return <SalesHistory />
      case 'returns':
        return <ProductReturnManagement />
      case 'customers':
        return <CustomerManagement />
      case 'delivery':
        return <DeliveryManagement />
      case 'receive-due':
        return <ReceiveDuePayments />
      case 'loyalty':
        return <EnhancedCustomerLoyaltyProgram />
      case 'analytics':
        return <EnhancedAnalyticsDashboard />
      case 'printer':
        return <BillPrinterService />
      case 'accounts':
        return <AccountsManagement />
      case 'invoices':
        return <InvoiceManagement />
      case 'license-management':
        return hasRole('admin') ? <EnhancedLicenseManagement /> : null
      case 'franchise-management':
        return hasRole('admin') ? <FranchiseManagement /> : null
      case 'multistore':
        return (hasRole('admin') || hasRole('manager')) ? <MultiStoreManagement /> : null
      case 'reporting':
        return (hasRole('admin') || hasRole('manager')) ? <AdvancedReporting /> : null
      case 'employees':
        return (hasRole('admin') || hasRole('manager')) ? <EmployeeManagement /> : null
      case 'users':
        return (hasRole('admin') || hasRole('manager')) ? <UserManagement /> : null
      case 'printer-management':
        return (hasRole('admin') || hasRole('manager')) ? <BillPrinterManagement /> : null
      case 'settings':
        return (hasRole('admin') || hasRole('manager')) ? <SettingsManagement /> : null
      default:
        return renderPOSContent()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation (only shown in vertical layout) */}
      {layout === 'vertical' && (
        <SidebarNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          cartCount={cartCount}
          cartTotal={cartTotal}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {layout === 'horizontal' && (
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600 mr-3" />
                  <h1 className="text-xl font-semibold text-gray-900">POS System</h1>
                </div>
              )}
              <div className="flex items-center space-x-4">
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${socket.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600">
                    {socket.isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                
                {/* Refresh Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center space-x-1"
                  title="Refresh current page"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                
                {layout === 'horizontal' && (
                  <>
                    <Badge variant="secondary" className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {cartCount} items
                    </Badge>
                    <Badge variant="outline">
                      Total: {formatPrice(cartTotal)}
                    </Badge>
                  </>
                )}
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {user?.name} ({user?.role})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-red-500 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs (only shown in horizontal layout) */}
        {layout === 'horizontal' && (
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-18">
                  <TabsTrigger value="pos" className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Point of Sale
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Products
                  </TabsTrigger>
                  <TabsTrigger value="attributes" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Attributes
                  </TabsTrigger>
                  <TabsTrigger value="variations" className="flex items-center">
                    <Box className="h-4 w-4 mr-2" />
                    Variations
                  </TabsTrigger>
                  <TabsTrigger value="inventory" className="flex items-center">
                    <Box className="h-4 w-4 mr-2" />
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger value="sales" className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Sales
                  </TabsTrigger>
                  <TabsTrigger value="returns" className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Returns
                  </TabsTrigger>
                  <TabsTrigger value="customers" className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Customers
                  </TabsTrigger>
                  <TabsTrigger value="loyalty" className="flex items-center">
                    <Gift className="h-4 w-4 mr-2" />
                    Loyalty
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="printer" className="flex items-center">
                    <Printer className="h-4 w-4 mr-2" />
                    Printer
                  </TabsTrigger>
                  <TabsTrigger value="accounts" className="flex items-center">
                    <Calculator className="h-4 w-4 mr-2" />
                    Accounts
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Invoices
                  </TabsTrigger>
                  {hasRole('admin') && (
                    <TabsTrigger value="license-management" className="flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Enhanced License
                    </TabsTrigger>
                  )}
                  {(hasRole('admin') || hasRole('manager')) && (
                    <TabsTrigger value="multistore" className="flex items-center">
                      <Store className="h-4 w-4 mr-2" />
                      Multi-Store
                    </TabsTrigger>
                  )}
                  {(hasRole('admin') || hasRole('manager')) && (
                    <TabsTrigger value="reporting" className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Reporting
                    </TabsTrigger>
                  )}
                  {(hasRole('admin') || hasRole('manager')) && (
                    <TabsTrigger value="employees" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Employees
                    </TabsTrigger>
                  )}
                  {(hasRole('admin') || hasRole('manager')) && (
                    <TabsTrigger value="users" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Users
                    </TabsTrigger>
                  )}
                  {(hasRole('admin') || hasRole('manager')) && (
                    <TabsTrigger value="printer-management" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Printer Mgmt
                    </TabsTrigger>
                  )}
                  {(hasRole('admin') || hasRole('manager')) && (
                    <TabsTrigger value="settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {layout === 'horizontal' ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {renderContent()}
            </div>
          ) : (
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                {renderContent()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Receipt/Invoice Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b bg-white shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Transaction Complete</h3>
                  <p className="text-sm text-gray-600">Sale ID: {lastSale.id.slice(-8)}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReceipt(false)
                    setLastSale(null)
                  }}
                  className="ml-4"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Document Type Selector */}
            <div className="px-6 py-4 border-b bg-gray-50 shrink-0">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">View as:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={documentType === 'receipt' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDocumentType('receipt')}
                    className="flex items-center space-x-2"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>Receipt</span>
                  </Button>
                  <Button
                    variant={documentType === 'invoice' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDocumentType('invoice')}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Invoice</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Content - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-0">
              <div className="bg-white rounded-lg shadow-sm border min-h-full">
                <ReceiptComponent 
                  sale={lastSale} 
                  viewType={documentType}
                  showActions={false}
                />
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-6 border-t bg-white shrink-0">
              <div className="space-y-4">
                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <Button 
                    onClick={handlePrint} 
                    className="flex items-center justify-center space-x-2 h-12 w-full touch-manipulation"
                    size="lg"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Print</span>
                    <span className="sm:hidden">Print</span>
                  </Button>
                  <Button 
                    onClick={handleDownload} 
                    variant="outline"
                    className="flex items-center justify-center space-x-2 h-12 w-full touch-manipulation"
                    size="lg"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Save</span>
                  </Button>
                  <Button 
                    onClick={handleEmail} 
                    variant="outline"
                    className="flex items-center justify-center space-x-2 h-12 w-full touch-manipulation"
                    size="lg"
                    disabled={!lastSale.customerEmail}
                  >
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Email</span>
                    <span className="sm:hidden">Email</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      // Thermal print option
                      const printContent = document.getElementById('receipt-content')
                      if (printContent) {
                        const thermalWindow = window.open('', '_blank')
                        if (thermalWindow) {
                          thermalWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>Thermal Receipt #${lastSale.id.slice(-8)}</title>
                              <style>
                                @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
                                
                                * {
                                  margin: 0;
                                  padding: 0;
                                  box-sizing: border-box;
                                }
                                
                                body { 
                                  font-family: 'Courier Prime', monospace;
                                  margin: 0; 
                                  padding: 10px; 
                                  font-size: 10px;
                                  line-height: 1.2;
                                  color: #000;
                                  background: white;
                                  width: 300px;
                                }
                                
                                .thermal-receipt {
                                  width: 100%;
                                  max-width: 300px;
                                  margin: 0 auto;
                                }
                                
                                .thermal-header {
                                  text-align: center;
                                  border-bottom: 1px dashed #000;
                                  padding-bottom: 5px;
                                  margin-bottom: 5px;
                                }
                                
                                .thermal-header h1 {
                                  font-size: 14px;
                                  font-weight: 700;
                                  margin-bottom: 2px;
                                }
                                
                                .thermal-items {
                                  margin: 5px 0;
                                }
                                
                                .thermal-item {
                                  display: flex;
                                  justify-content: space-between;
                                  margin-bottom: 2px;
                                }
                                
                                .thermal-totals {
                                  border-top: 1px dashed #000;
                                  padding-top: 5px;
                                  margin-top: 5px;
                                }
                                
                                .thermal-total {
                                  display: flex;
                                  justify-content: space-between;
                                  font-weight: 700;
                                }
                                
                                @media print {
                                  body { 
                                    background: white; 
                                    padding: 0;
                                    width: 300px;
                                  }
                                }
                              </style>
                            </head>
                            <body>
                              <div class="thermal-receipt">
                                <div class="thermal-header">
                                  <h1>YOUR BUSINESS</h1>
                                  <div>Receipt #${lastSale.id.slice(-8)}</div>
                                  <div>${new Date(lastSale.createdAt).toLocaleString()}</div>
                                </div>
                                <div class="thermal-items">
                                  ${lastSale.saleItems.map((item: any) => `
                                    <div class="thermal-item">
                                      <span>${item.product.name} x${item.quantity}</span>
                                      <span>${formatPrice(item.totalPrice)}</span>
                                    </div>
                                  `).join('')}
                                </div>
                                <div class="thermal-totals">
                                  <div class="thermal-item">
                                    <span>Subtotal:</span>
                                    <span>${formatPrice(lastSale.totalAmount)}</span>
                                  </div>
                                  <div class="thermal-item">
                                    <span>Tax:</span>
                                    <span>${formatPrice(lastSale.taxAmount)}</span>
                                  </div>
                                  ${(lastSale.discount || 0) > 0 ? `
                                    <div class="thermal-item">
                                      <span>Discount:</span>
                                      <span>-${formatPrice(lastSale.discount)}</span>
                                    </div>
                                  ` : ''}
                                  <div class="thermal-total">
                                    <span>TOTAL:</span>
                                    <span>${formatPrice(lastSale.totalAmount + lastSale.taxAmount - (lastSale.discount || 0))}</span>
                                  </div>
                                  <div style="text-align: center; margin-top: 5px;">
                                    ${lastSale.paymentMethod.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </body>
                            </html>
                          `)
                          thermalWindow.document.close()
                          thermalWindow.print()
                          thermalWindow.close()
                          
                          toast({
                            title: "Thermal receipt sent to printer",
                            description: "Receipt formatted for 80mm thermal printer",
                          })
                        }
                      }
                    }}
                    variant="outline"
                    className="flex items-center justify-center space-x-2 h-12 w-full touch-manipulation"
                    size="lg"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Thermal</span>
                    <span className="sm:hidden">80mm</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowReceipt(false)
                      setLastSale(null)
                    }}
                    variant="outline"
                    className="flex items-center justify-center space-x-2 h-12 w-full touch-manipulation"
                    size="lg"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Close</span>
                    <span className="sm:hidden">Done</span>
                  </Button>
                </div>

                {/* Auto-print Option */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoPrint"
                        checked={autoPrintEnabled}
                        onChange={(e) => {
                          const newValue = e.target.checked
                          setAutoPrintEnabled(newValue)
                          // Save to localStorage immediately
                          localStorage.setItem('autoPrintEnabled', newValue.toString())
                          toast({
                            title: newValue ? "Auto-print enabled" : "Auto-print disabled",
                            description: newValue 
                              ? "Receipts will automatically print after each sale" 
                              : "Auto-print has been disabled",
                          })
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <label htmlFor="autoPrint" className="text-sm font-medium text-blue-900 cursor-pointer select-none">
                        Auto-print receipts for future sales
                      </label>
                    </div>
                    <Settings className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-blue-700 mt-2 select-none">
                    When enabled, receipts will automatically print after each successful sale
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}