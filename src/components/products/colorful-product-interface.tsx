'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ColorfulCard } from '@/components/ui/colorful-card'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Search, Plus, Edit, Trash2, Eye, Star, Filter, Grid, List, Package, DollarSign, TrendingUp } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  image?: string
  rating: number
  description: string
  featured: boolean
  sales: number
}

interface Category {
  id: string
  name: string
  count: number
  color: string
}

export function ColorfulProductInterface() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      setIsLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock categories
      const mockCategories: Category[] = [
        { id: 'all', name: 'All Products', count: 12, color: '#3B82F6' },
        { id: 'electronics', name: 'Electronics', count: 4, color: '#10B981' },
        { id: 'clothing', name: 'Clothing', count: 3, color: '#F59E0B' },
        { id: 'food', name: 'Food & Beverage', count: 3, color: '#EF4444' },
        { id: 'books', name: 'Books', count: 2, color: '#8B5CF6' }
      ]

      // Mock products
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Wireless Headphones',
          price: 99.99,
          category: 'electronics',
          stock: 25,
          rating: 4.5,
          description: 'High-quality wireless headphones with noise cancellation',
          featured: true,
          sales: 150
        },
        {
          id: '2',
          name: 'Smart Watch',
          price: 199.99,
          category: 'electronics',
          stock: 15,
          rating: 4.8,
          description: 'Feature-rich smartwatch with health monitoring',
          featured: true,
          sales: 89
        },
        {
          id: '3',
          name: 'Cotton T-Shirt',
          price: 24.99,
          category: 'clothing',
          stock: 50,
          rating: 4.2,
          description: 'Comfortable cotton t-shirt in various colors',
          featured: false,
          sales: 200
        },
        {
          id: '4',
          name: 'Organic Coffee',
          price: 12.99,
          category: 'food',
          stock: 100,
          rating: 4.7,
          description: 'Premium organic coffee beans',
          featured: true,
          sales: 300
        },
        {
          id: '5',
          name: 'JavaScript Guide',
          price: 29.99,
          category: 'books',
          stock: 30,
          rating: 4.9,
          description: 'Complete guide to modern JavaScript development',
          featured: false,
          sales: 75
        },
        {
          id: '6',
          name: 'Bluetooth Speaker',
          price: 79.99,
          category: 'electronics',
          stock: 20,
          rating: 4.3,
          description: 'Portable Bluetooth speaker with excellent sound quality',
          featured: false,
          sales: 120
        },
        {
          id: '7',
          name: 'Denim Jeans',
          price: 59.99,
          category: 'clothing',
          stock: 35,
          rating: 4.4,
          description: 'Classic denim jeans with perfect fit',
          featured: false,
          sales: 180
        },
        {
          id: '8',
          name: 'Green Tea',
          price: 8.99,
          category: 'food',
          stock: 80,
          rating: 4.6,
          description: 'Premium green tea leaves',
          featured: false,
          sales: 250
        },
        {
          id: '9',
          name: 'React Cookbook',
          price: 39.99,
          category: 'books',
          stock: 25,
          rating: 4.8,
          description: 'Practical recipes for building React applications',
          featured: true,
          sales: 95
        },
        {
          id: '10',
          name: 'Laptop Stand',
          price: 34.99,
          category: 'electronics',
          stock: 40,
          rating: 4.1,
          description: 'Ergonomic laptop stand for better posture',
          featured: false,
          sales: 110
        },
        {
          id: '11',
          name: 'Winter Jacket',
          price: 89.99,
          category: 'clothing',
          stock: 20,
          rating: 4.6,
          description: 'Warm and stylish winter jacket',
          featured: true,
          sales: 65
        },
        {
          id: '12',
          name: 'Honey',
          price: 15.99,
          category: 'food',
          stock: 60,
          rating: 4.9,
          description: 'Pure natural honey',
          featured: false,
          sales: 140
        }
      ]

      setCategories(mockCategories)
      setProducts(mockProducts)
      setFilteredProducts(mockProducts)
      setIsLoading(false)
    }

    loadData()
  }, [])

  useEffect(() => {
    // Filter products based on selected category and search term
    let filtered = products

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [products, selectedCategory, searchTerm])

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'Out of Stock', color: 'error' }
    if (stock < 10) return { status: 'Low Stock', color: 'warning' }
    if (stock < 20) return { status: 'Medium Stock', color: 'accent' }
    return { status: 'In Stock', color: 'success' }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Product Management</h1>
              <p className="text-gray-600">Manage your inventory with style</p>
            </div>
            <AnimatedButton
              variant="primary"
              size="lg"
              icon={<Plus className="w-5 h-5" />}
            >
              Add Product
            </AnimatedButton>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <AnimatedButton
                variant="outline"
                size="md"
                icon={<Filter className="w-4 h-4" />}
              >
                Filters
              </AnimatedButton>
              
              <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                  border: selectedCategory === category.id ? 'none' : `2px solid ${category.color}20`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category.name}
                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                  {category.count}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Products Grid/List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => {
                const stockStatus = getStockStatus(product.stock)
                const categoryColor = categories.find(c => c.id === product.category)?.color || '#3B82F6'
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <ColorfulCard
                      color="primary"
                      variant="solid"
                      hoverEffect="lift"
                      className="h-full"
                    >
                      {/* Product Image */}
                      <div className="relative mb-4">
                        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-400" />
                        </div>
                        
                        {/* Featured Badge */}
                        {product.featured && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Featured
                          </div>
                        )}
                        
                        {/* Stock Status */}
                        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                          stockStatus.color === 'success' ? 'bg-green-500 text-white' :
                          stockStatus.color === 'warning' ? 'bg-yellow-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {stockStatus.status}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-white text-lg mb-1">{product.name}</h3>
                          <p className="text-white/70 text-sm line-clamp-2">{product.description}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-white">${product.price}</div>
                          <div className="text-sm text-white/60">Stock: {product.stock}</div>
                        </div>

                        <div>
                          {renderStars(product.rating)}
                        </div>

                        <div className="flex items-center justify-between text-sm text-white/60">
                          <span>{product.sales} sales</span>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
                            <span>{product.category}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <AnimatedButton
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-3 h-3" />}
                            className="flex-1"
                          >
                            View
                          </AnimatedButton>
                          <AnimatedButton
                            variant="secondary"
                            size="sm"
                            icon={<Edit className="w-3 h-3" />}
                            className="flex-1"
                          >
                            Edit
                          </AnimatedButton>
                          <AnimatedButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="w-3 h-3" />}
                          />
                        </div>
                      </div>
                    </ColorfulCard>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product, index) => {
                const stockStatus = getStockStatus(product.stock)
                const categoryColor = categories.find(c => c.id === product.category)?.color || '#3B82F6'
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <ColorfulCard
                      color="primary"
                      variant="solid"
                      hoverEffect="lift"
                    >
                      <div className="flex items-center gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-white text-lg">{product.name}</h3>
                              <p className="text-white/70 text-sm">{product.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {product.featured && (
                                <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                  Featured
                                </div>
                              )}
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                stockStatus.color === 'success' ? 'bg-green-500 text-white' :
                                stockStatus.color === 'warning' ? 'bg-yellow-500 text-white' :
                                'bg-red-500 text-white'
                              }`}>
                                {stockStatus.status}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-xl font-bold text-white">${product.price}</div>
                            <div className="text-white/60">Stock: {product.stock}</div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
                              <span className="text-white/60">{product.category}</span>
                            </div>
                            <div>{renderStars(product.rating)}</div>
                            <div className="text-white/60">{product.sales} sales</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <AnimatedButton
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-4 h-4" />}
                          >
                            View
                          </AnimatedButton>
                          <AnimatedButton
                            variant="secondary"
                            size="sm"
                            icon={<Edit className="w-4 h-4" />}
                          >
                            Edit
                          </AnimatedButton>
                          <AnimatedButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                          />
                        </div>
                      </div>
                    </ColorfulCard>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <AnimatedButton
              variant="primary"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
            >
              Clear Filters
            </AnimatedButton>
          </motion.div>
        )}

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <ColorfulCard color="primary" variant="solid">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{products.length}</div>
              <div className="text-white/70 text-sm">Total Products</div>
            </div>
          </ColorfulCard>
          
          <ColorfulCard color="success" variant="solid">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {products.filter(p => p.stock > 0).length}
              </div>
              <div className="text-white/70 text-sm">In Stock</div>
            </div>
          </ColorfulCard>
          
          <ColorfulCard color="warning" variant="solid">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {products.filter(p => p.stock < 10).length}
              </div>
              <div className="text-white/70 text-sm">Low Stock</div>
            </div>
          </ColorfulCard>
          
          <ColorfulCard color="accent" variant="solid">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                ${products.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
              </div>
              <div className="text-white/70 text-sm">Total Value</div>
            </div>
          </ColorfulCard>
        </motion.div>
      </div>
    </div>
  )
}