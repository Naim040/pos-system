"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { useSocket } from '@/hooks/useSocket'
import ProtectedRoute from '@/components/ProtectedRoute'
import LicenseWrapper from '@/components/LicenseWrapper'
import { useRouter } from 'next/navigation'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'
import { Button } from '@/components/ui/button'

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

export default function POS() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [redeemPoints, setRedeemPoints] = useState<number>(0)
  const [pointsDiscount, setPointsDiscount] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false)
  const { toast } = useToast()
  const { user, logout, hasRole } = useAuth()
  const router = useRouter()

  // Socket integration for real-time updates
  const socket = useSocket({
    rooms: ['products', 'customers', 'sales'],
    onProductUpdated: (data) => {
      // Update products when they change
      setProducts(prev => prev.map(p => 
        p.id === data.productId ? { ...p, ...data } : p
      ))
    },
    onCustomerUpdated: (data) => {
      // Update customers when they change
      setCustomers(prev => prev.map(c => 
        c.id === data.customerId ? { ...c, ...data } : c
      ))
      // Update selected customer if it's the one being updated
      if (selectedCustomer && selectedCustomer.id === data.customerId) {
        setSelectedCustomer(prev => prev ? { ...prev, ...data } : null)
      }
    },
    onSaleCreated: (data) => {
      // Show notification for new sales from other devices
      toast({
        title: "New Sale",
        description: `Sale of ${formatPrice(data.totalAmount)} completed`,
      })
    },
    onLowStockAlert: (data) => {
      // Show low stock alerts
      data.items.forEach((item: any) => {
        toast({
          title: "Low Stock Alert",
          description: `${item.product.name} is running low (${item.quantity} left)`,
          variant: "destructive"
        })
      })
    }
  })

  // Fetch products and customers from API
  useEffect(() => {
    fetchProducts()
    fetchCustomers()
    fetchSettings()
  }, [])

  // Save auto-print setting to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('autoPrintEnabled', autoPrintEnabled.toString())
  }, [autoPrintEnabled])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.printer && typeof data.printer.autoPrint === 'boolean') {
          setAutoPrintEnabled(data.printer.autoPrint)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // Fallback to localStorage if API fails
      const savedAutoPrint = localStorage.getItem('autoPrintEnabled')
      if (savedAutoPrint !== null) {
        setAutoPrintEnabled(savedAutoPrint === 'true')
      }
    }
  }

  const updateAutoPrintSetting = async (enabled: boolean) => {
    setAutoPrintEnabled(enabled)
    
    try {
      // Update settings in the backend
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printer: {
            autoPrint: enabled
          }
        }),
      })

      if (response.ok) {
        toast({
          title: "Setting updated",
          description: `Auto-print ${enabled ? 'enabled' : 'disabled'}`,
        })
      } else {
        // If API fails, still save to localStorage as fallback
        localStorage.setItem('autoPrintEnabled', enabled.toString())
        toast({
          title: "Setting updated locally",
          description: `Auto-print ${enabled ? 'enabled' : 'disabled'} (saved locally)`,
        })
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      // Fallback to localStorage
      localStorage.setItem('autoPrintEnabled', enabled.toString())
      toast({
        title: "Setting updated locally",
        description: `Auto-print ${enabled ? 'enabled' : 'disabled'} (saved locally)`,
      })
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        // Fallback to mock data if API fails
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Coffee',
            description: 'Fresh brewed coffee',
            price: 3.50,
            sku: 'COF001',
            category: { id: '1', name: 'Beverages' }
          },
          {
            id: '2',
            name: 'Sandwich',
            description: 'Club sandwich',
            price: 8.99,
            sku: 'SND001',
            category: { id: '2', name: 'Food' }
          },
          {
            id: '3',
            name: 'Water Bottle',
            description: '500ml water',
            price: 1.50,
            sku: 'WAT001',
            category: { id: '1', name: 'Beverages' }
          },
          {
            id: '4',
            name: 'Chips',
            description: 'Potato chips',
            price: 2.99,
            sku: 'CHP001',
            category: { id: '3', name: 'Snacks' }
          },
          {
            id: '5',
            name: 'Soda',
            description: 'Coca Cola',
            price: 2.50,
            sku: 'SOD001',
            category: { id: '1', name: 'Beverages' }
          },
          {
            id: '6',
            name: 'Cookie',
            description: 'Chocolate chip cookie',
            price: 2.25,
            sku: 'CKI001',
            category: { id: '3', name: 'Snacks' }
          }
        ]
        setProducts(mockProducts)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      })
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * product.price }
            : item
        )
      } else {
        return [...prevCart, { product, quantity: 1, totalPrice: product.price }]
      }
    })
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to cart`,
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.product.price }
          : item
      )
    )
  }

  const cartTotal = cart.reduce((total, item) => total + item.totalPrice, 0)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
  }

  const handlePointsRedeem = (points: number) => {
    if (!selectedCustomer) return
    
    const maxPoints = selectedCustomer.loyaltyPoints
    const maxDiscount = Math.floor(maxPoints / 10) // 10 points = ৳1 discount
    const requestedDiscount = Math.floor(points / 10)
    
    if (points > maxPoints) {
      toast({
        title: "Insufficient points",
        description: `Customer only has ${maxPoints} points available`,
        variant: "destructive"
      })
      return
    }
    
    if (requestedDiscount > cartTotal) {
      toast({
        title: "Discount too high",
        description: "Discount cannot exceed total amount",
        variant: "destructive"
      })
      return
    }
    
    setRedeemPoints(points)
    setPointsDiscount(requestedDiscount)
    
    toast({
      title: "Points redeemed",
      description: `${points} points redeemed for ${formatPrice(requestedDiscount)} discount`,
    })
  }

  const clearPointsRedemption = () => {
    setRedeemPoints(0)
    setPointsDiscount(0)
  }

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'due') => {
    console.log('handleCheckout called with paymentMethod:', paymentMethod)
    console.log('Cart length:', cart.length)
    console.log('Selected customer:', selectedCustomer)
    
    if (cart.length === 0) {
      console.log('Cart is empty, returning early')
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      })
      return
    }

    if (paymentMethod === 'due' && !selectedCustomer) {
      console.log('Due payment without customer, returning early')
      toast({
        title: "Customer required",
        description: "Please select a customer for due payment",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    console.log('Starting checkout process...')
    
    try {
      const saleData = {
        totalAmount: cartTotal,
        taxAmount: cartTotal * 0.08,
        discount: pointsDiscount,
        paymentMethod,
        customerId: selectedCustomer?.id || null,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.totalPrice
        }))
      }

      console.log('Sending sale data to API:', saleData)
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      })

      console.log('API response status:', response.status)

      if (response.ok) {
        const saleData = await response.json()
        
        // Create loyalty redemption transaction if points were redeemed
        if (redeemPoints > 0 && selectedCustomer) {
          await fetch(`/api/customers/${selectedCustomer.id}/loyalty`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              points: redeemPoints,
              type: 'redeemed',
              description: `Redeemed ${redeemPoints} points for discount`
            }),
          })
        }
        
        // Emit real-time events
        socket.emitNewSale(saleData)
        
        setLastSale(saleData)
        setShowReceipt(true)
        
        // Auto-print functionality
        if (autoPrintEnabled) {
          // Wait a moment for the receipt modal to be fully rendered
          setTimeout(() => {
            const printContent = document.getElementById('receipt-content')
            if (printContent) {
              const printWindow = window.open('', '_blank')
              if (printWindow) {
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Receipt #${saleData.id.slice(-8)}</title>
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
                  title: "Auto-print completed",
                  description: "Receipt has been automatically sent to printer",
                })
              } else {
                toast({
                  title: "Auto-print failed",
                  description: "Could not open print window. Please check your browser settings.",
                  variant: "destructive"
                })
              }
            } else {
              // Fallback: try again after a longer delay
              setTimeout(() => {
                const fallbackPrintContent = document.getElementById('receipt-content')
                if (fallbackPrintContent) {
                  const printWindow = window.open('', '_blank')
                  if (printWindow) {
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Receipt #${saleData.id.slice(-8)}</title>
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
                        ${fallbackPrintContent.innerHTML}
                      </body>
                      </html>
                    `)
                    printWindow.document.close()
                    printWindow.print()
                    printWindow.close()
                    
                    toast({
                      title: "Auto-print completed",
                      description: "Receipt has been automatically sent to printer",
                    })
                  }
                } else {
                  toast({
                    title: "Auto-print failed",
                    description: "Could not find receipt content. Please use the print button in the receipt modal.",
                    variant: "destructive"
                  })
                }
              }, 2000) // Second attempt after 2 seconds
            }
          }, 1500) // Initial attempt after 1.5 seconds
        }
        
        const customerName = selectedCustomer ? ` for ${selectedCustomer.name}` : ''
        const discountText = pointsDiscount > 0 ? ` (${formatPrice(pointsDiscount)} discount applied)` : ''
        const paymentMessage = paymentMethod === 'due' 
          ? `Order marked as due for ${selectedCustomer?.name}`
          : `Payment of ${formatPrice(cartTotal * 1.08 - pointsDiscount)} processed via ${paymentMethod}`
        
        toast({
          title: paymentMethod === 'due' ? "Order marked as due" : "Payment successful",
          description: `${paymentMessage}${customerName}${discountText}`,
        })
        
        setCart([])
        setSelectedCustomer(null)
        clearPointsRedemption()
        fetchProducts() // Refresh products to update inventory
        console.log('Checkout completed successfully')
      } else {
        const errorData = await response.json()
        console.log('Checkout failed:', errorData)
        
        // Enhanced error handling with specific messages
        let errorMessage = errorData.details || errorData.error || "Failed to process payment"
        
        // Provide more user-friendly error messages
        if (errorMessage.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (errorMessage.includes("inventory")) {
          errorMessage = "Some items are out of stock. Please check inventory and try again."
        } else if (errorMessage.includes("customer")) {
          errorMessage = "Customer information is invalid or not found."
        } else if (errorMessage.includes("payment")) {
          errorMessage = "Payment processing failed. Please try a different payment method."
        }
        
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
          action: (
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // Retry the payment
                  handleCheckout(paymentMethod)
                }}
              >
                Retry Payment
              </Button>
            </div>
          )
        })
      }
    } catch (error) {
      console.error('Payment error:', error)
      
      let errorMessage = "An unexpected error occurred"
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection."
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
        action: (
          <div className="mt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                // Retry the payment
                handleCheckout(paymentMethod)
              }}
            >
              Retry Payment
            </Button>
          </div>
        )
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <LicenseWrapper
        products={products}
        cart={cart}
        customers={customers}
        selectedCustomer={selectedCustomer}
        redeemPoints={redeemPoints}
        pointsDiscount={pointsDiscount}
        searchTerm={searchTerm}
        customerSearchTerm={customerSearchTerm}
        loading={loading}
        showReceipt={showReceipt}
        lastSale={lastSale}
        autoPrintEnabled={autoPrintEnabled}
        setAutoPrintEnabled={updateAutoPrintSetting}
        socket={socket}
        cartTotal={cartTotal}
        cartCount={cartCount}
        
        // Handlers
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        setSelectedCustomer={setSelectedCustomer}
        setSearchTerm={setSearchTerm}
        setCustomerSearchTerm={setCustomerSearchTerm}
        handlePointsRedeem={handlePointsRedeem}
        clearPointsRedemption={clearPointsRedemption}
        handleCheckout={handleCheckout}
        setShowReceipt={setShowReceipt}
        setLastSale={setLastSale}
        handleLogout={handleLogout}
        fetchProducts={fetchProducts}
      />
    </ProtectedRoute>
  )
}