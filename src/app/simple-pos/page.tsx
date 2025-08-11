"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ShoppingCart, Package, Search, Plus, Minus, CreditCard, DollarSign } from 'lucide-react'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku?: string
  barcode?: string
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

export default function SimplePOS() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiLoading, setApiLoading] = useState(true)
  const { toast } = useToast()

  // Simple product fetch with error handling
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setApiLoading(true)
        const response = await fetch('/api/products')
        
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        } else {
          // Fallback to mock data
          setProducts([
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
              name: 'Cookie',
              description: 'Chocolate chip cookie',
              price: 2.25,
              sku: 'CKI001',
              category: { id: '3', name: 'Snacks' }
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        // Fallback to mock data
        setProducts([
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
          }
        ])
      } finally {
        setApiLoading(false)
      }
    }

    fetchProducts()
  }, [])

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

  const handleCheckout = async (paymentMethod: 'cash' | 'card') => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      // Simple checkout without complex API calls
      const saleData = {
        totalAmount: cartTotal,
        taxAmount: cartTotal * 0.08,
        paymentMethod,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.totalPrice
        }))
      }

      console.log('Processing sale:', saleData)
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Payment successful",
        description: `Payment of $${(cartTotal * 1.08).toFixed(2)} processed via ${paymentMethod}`,
      })
      
      setCart([])
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment failed",
        description: "Failed to process payment",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (apiLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Simple POS System</h1>
          <p className="text-gray-600">Basic point of sale functionality</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Products
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-sm">{product.name}</h3>
                          <Badge variant="outline">${product.price.toFixed(2)}</Badge>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Shopping Cart ({cartCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <p className="text-xs text-gray-600">${item.product.price.toFixed(2)} each</p>
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
                          <span className="w-16 text-right text-sm font-medium">
                            ${item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (8%):</span>
                        <span>${(cartTotal * 0.08).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${(cartTotal * 1.08).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-4">
                      <Button
                        onClick={() => handleCheckout('cash')}
                        disabled={loading || cart.length === 0}
                        className="w-full"
                        variant="outline"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        {loading ? 'Processing...' : 'Cash Payment'}
                      </Button>
                      <Button
                        onClick={() => handleCheckout('card')}
                        disabled={loading || cart.length === 0}
                        className="w-full"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {loading ? 'Processing...' : 'Card Payment'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}