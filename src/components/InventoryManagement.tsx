"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search,
  RefreshCw,
  FileText,
  Users,
  Printer,
  Download,
  Barcode,
  QrCode,
  FileBarChart
} from 'lucide-react'

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

interface Inventory {
  id: string
  productId: string
  storeId: string
  quantity: number
  minStock: number
  maxStock?: number
  reorderPoint: number
  costPrice: number
  location?: string
  isActive: boolean
  product: Product
}

interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  productCount?: number
}

interface Brand {
  id: string
  name: string
  description?: string
  website?: string
  isActive: boolean
  productCount?: number
}

const InventoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStore, setSelectedStore] = useState('all')
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showBrandDialog, setShowBrandDialog] = useState(false)
  
  // Quick Print Actions state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [printType, setPrintType] = useState<'barcode' | 'stock' | 'details'>('barcode')
  const [printSize, setPrintSize] = useState<'58mm' | '80mm' | 'a4'>('80mm')
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [printPreviewContent, setPrintPreviewContent] = useState('')
  
  const { toast } = useToast()
  
  // Form state for dialogs
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const [brandForm, setBrandForm] = useState({
    name: '',
    description: '',
    website: '',
    isActive: true
  })

  // Form handlers
  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      isActive: true
    })
  }

  const resetBrandForm = () => {
    setBrandForm({
      name: '',
      description: '',
      website: '',
      isActive: true
    })
  }

  const handleCategorySubmit = async () => {
    try {
      console.log('Category form submitted:', categoryForm)
      
      // Call the API to create the category
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create category')
      }

      const newCategory = await response.json()
      
      // Add to categories list with the database-generated data
      const categoryWithExtras: Category = {
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description,
        isActive: categoryForm.isActive,
        productCount: 0
      }
      
      setCategories([...categories, categoryWithExtras])
      resetCategoryForm()
      setShowCategoryDialog(false)
      
      console.log('Category created successfully!')
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category. Please try again.')
    }
  }

  const handleBrandSubmit = async () => {
    try {
      console.log('Brand form submitted:', brandForm)
      
      // Call the API to create the brand
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: brandForm.name,
          description: brandForm.description,
          website: brandForm.website,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create brand')
      }

      const newBrand = await response.json()
      
      // Add to brands list with the database-generated data
      const brandWithExtras: Brand = {
        id: newBrand.id,
        name: newBrand.name,
        description: newBrand.description,
        website: newBrand.website,
        isActive: brandForm.isActive,
        productCount: 0
      }
      
      setBrands([...brands, brandWithExtras])
      resetBrandForm()
      setShowBrandDialog(false)
      
      console.log('Brand created successfully!')
    } catch (error) {
      console.error('Error creating brand:', error)
      alert('Failed to create brand. Please try again.')
    }
  }

  // Quick Print Actions Functions
  const handleItemSelect = (itemId: string, checked: boolean) => {
    console.log('handleItemSelect called:', itemId, checked)
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(itemId)
      } else {
        newSet.delete(itemId)
      }
      console.log('New selectedItems size:', newSet.size)
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    console.log('handleSelectAll called:', checked)
    if (checked) {
      const allIds = filteredInventory.map(item => item.id)
      setSelectedItems(new Set(allIds))
      console.log('Selected all items, count:', allIds.length)
    } else {
      setSelectedItems(new Set())
      console.log('Cleared all selections')
    }
  }

  const openPrintDialog = (type: 'barcode' | 'stock' | 'details') => {
    console.log('openPrintDialog called with type:', type)
    console.log('selectedItems.size:', selectedItems.size)
    
    if (selectedItems.size === 0) {
      console.log('No items selected, showing toast')
      toast({
        title: "No items selected",
        description: "Please select at least one item to print",
        variant: "destructive"
      })
      return
    }
    
    console.log('Setting print type and opening dialog')
    setPrintType(type)
    setShowPrintDialog(true)
    console.log('showPrintDialog set to true')
  }

  const generateBarcodeLabel = (item: Inventory) => {
    const barcode = item.product.barcode || '1234567890123'
    return `
      <div class="barcode-label bg-white p-4 text-center" style="width: ${printSize === '58mm' ? '200px' : printSize === '80mm' ? '280px' : '400px'}; margin: 0 auto; font-family: monospace;">
        <div class="product-name font-bold text-sm mb-2">${item.product.name}</div>
        <div class="barcode-display text-lg mb-2" style="font-family: 'Courier New', monospace; letter-spacing: 2px;">${barcode}</div>
        <div class="sku text-xs text-gray-600 mb-1">SKU: ${item.product.sku || 'N/A'}</div>
        <div class="price text-sm font-semibold">$${item.product.price.toFixed(2)}</div>
        ${printSize !== '58mm' ? `<div class="category text-xs text-gray-500 mt-1">${item.product.category?.name || 'N/A'}</div>` : ''}
      </div>
    `
  }

  const generateStockSummary = () => {
    const selectedInventory = inventory.filter(item => selectedItems.has(item.id))
    return `
      <div class="stock-summary bg-white p-6" style="max-width: ${printSize === 'a4' ? '800px' : '400px'}; margin: 0 auto; font-family: Arial, sans-serif;">
        <div class="header text-center mb-6">
          <h2 style="font-size: ${printSize === 'a4' ? '24px' : '18px'}; font-weight: bold; margin-bottom: 10px;">Stock Summary Report</h2>
          <div style="font-size: ${printSize === 'a4' ? '14px' : '12px'}; color: #666;">
            Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
          </div>
          <div style="font-size: ${printSize === 'a4' ? '14px' : '12px'}; color: #666;">
            Total Items: ${selectedInventory.length}
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: ${printSize === 'a4' ? '14px' : '11px'};">
          <thead>
            <tr style="border-bottom: 2px solid #333; background-color: #f5f5f5;">
              <th style="text-align: left; padding: 8px; ${printSize === '58mm' ? 'display: none;' : ''}">Product</th>
              <th style="text-align: center; padding: 8px;">SKU</th>
              <th style="text-align: center; padding: 8px;">Stock</th>
              <th style="text-align: center; padding: 8px; ${printSize === '58mm' ? 'display: none;' : ''}">Min</th>
              <th style="text-align: center; padding: 8px; ${printSize === '58mm' ? 'display: none;' : ''}">Location</th>
            </tr>
          </thead>
          <tbody>
            ${selectedInventory.map(item => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 6px; ${printSize === '58mm' ? 'display: none;' : ''}">${item.product.name}</td>
                <td style="padding: 6px; text-align: center; font-family: monospace;">${item.product.sku || 'N/A'}</td>
                <td style="padding: 6px; text-align: center; font-weight: bold; color: ${item.quantity <= item.reorderPoint ? '#d32f2f' : '#2e7d32'};">
                  ${item.quantity}
                </td>
                <td style="padding: 6px; text-align: center; ${printSize === '58mm' ? 'display: none;' : ''}">${item.minStock}</td>
                <td style="padding: 6px; text-align: center; ${printSize === '58mm' ? 'display: none;' : ''}">${item.location || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer mt-6 text-center" style="font-size: ${printSize === 'a4' ? '12px' : '10px'}; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
          Generated by POS Inventory System
        </div>
      </div>
    `
  }

  const generateProductDetails = (item: Inventory) => {
    return `
      <div class="product-details bg-white p-6" style="max-width: ${printSize === 'a4' ? '600px' : '350px'}; margin: 0 auto; font-family: Arial, sans-serif;">
        <div class="header text-center mb-6">
          <h2 style="font-size: ${printSize === 'a4' ? '20px' : '16px'}; font-weight: bold;">Product Details</h2>
        </div>
        
        <div class="product-info mb-6">
          <div style="font-size: ${printSize === 'a4' ? '18px' : '16px'}; font-weight: bold; margin-bottom: 8px;">
            ${item.product.name}
          </div>
          ${item.product.description ? `<div style="font-size: ${printSize === 'a4' ? '14px' : '12px'}; color: #666; margin-bottom: 16px;">
            ${item.product.description}
          </div>` : ''}
        </div>
        
        <div class="details-grid" style="display: grid; grid-template-columns: ${printSize === 'a4' ? '1fr 1fr' : '1fr'}; gap: 12px; font-size: ${printSize === 'a4' ? '14px' : '12px'};">
          <div><strong>SKU:</strong> ${item.product.sku || 'N/A'}</div>
          <div><strong>Barcode:</strong> ${item.product.barcode || 'N/A'}</div>
          <div><strong>Category:</strong> ${item.product.category?.name || 'N/A'}</div>
          <div><strong>Price:</strong> $${item.product.price.toFixed(2)}</div>
          <div><strong>Current Stock:</strong> <span style="color: ${item.quantity <= item.reorderPoint ? '#d32f2f' : '#2e7d32'}; font-weight: bold;">${item.quantity}</span></div>
          <div><strong>Min Stock:</strong> ${item.minStock}</div>
          <div><strong>Reorder Point:</strong> ${item.reorderPoint}</div>
          <div><strong>Cost Price:</strong> $${item.costPrice.toFixed(2)}</div>
          <div style="grid-column: ${printSize === 'a4' ? '1 / -1' : '1 / -1'};"><strong>Location:</strong> ${item.location || 'N/A'}</div>
        </div>
        
        ${printSize !== '58mm' ? `
        <div class="barcode-section mt-6 text-center">
          <div style="font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 2px; background: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${item.product.barcode || '1234567890123'}
          </div>
        </div>
        ` : ''}
        
        <div class="footer mt-6 text-center" style="font-size: ${printSize === 'a4' ? '12px' : '10px'}; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
          Generated on ${new Date().toLocaleDateString()} | ID: ${item.id.slice(-8)}
        </div>
      </div>
    `
  }

  const generatePrintPreview = () => {
    const selectedInventory = inventory.filter(item => selectedItems.has(item.id))
    
    if (selectedInventory.length === 0) return ''

    let content = ''
    
    switch (printType) {
      case 'barcode':
        content = selectedInventory.map(item => generateBarcodeLabel(item)).join('<div style="page-break-after: always; margin-bottom: 20px;"></div>')
        break
      case 'stock':
        content = generateStockSummary()
        break
      case 'details':
        content = selectedInventory.map(item => generateProductDetails(item)).join('<div style="page-break-after: always; margin-bottom: 20px;"></div>')
        break
    }
    
    return content
  }

  const handlePrint = () => {
    console.log('handlePrint called')
    const content = generatePrintPreview()
    console.log('Generated content length:', content?.length || 0)
    
    if (!content) {
      console.log('No content generated, returning early')
      return
    }

    console.log('Setting print preview content and opening preview dialog')
    setPrintPreviewContent(content)
    setShowPrintPreview(true)
    setShowPrintDialog(false)
    console.log('Print preview dialog opened, print dialog closed')
    
    toast({
      title: "Print preview generated",
      description: "Use browser print to print the document",
    })
  }

  const handleDownloadPDF = () => {
    const content = generatePrintPreview()
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${printType === 'barcode' ? 'Barcode Labels' : printType === 'stock' ? 'Stock Summary' : 'Product Details'}</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${content}
          <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  // Mock data for demonstration
  const mockInventory: Inventory[] = [
    {
      id: '1',
      productId: '1',
      storeId: '1',
      quantity: 45,
      minStock: 10,
      maxStock: 100,
      reorderPoint: 15,
      costPrice: 1.50,
      location: 'Warehouse A',
      isActive: true,
      product: {
        id: '1',
        name: 'Chocolate Chip Cookie',
        description: 'Fresh baked chocolate chip cookies',
        price: 2.25,
        sku: 'COOKIE-001',
        barcode: '1234567890123',
        category: { id: '1', name: 'Bakery' }
      }
    },
    {
      id: '2',
      productId: '2',
      storeId: '1',
      quantity: 8,
      minStock: 20,
      maxStock: 200,
      reorderPoint: 25,
      costPrice: 0.80,
      location: 'Warehouse B',
      isActive: true,
      product: {
        id: '2',
        name: 'Soda Can',
        description: 'Refreshing carbonated beverage',
        price: 2.50,
        sku: 'SODA-001',
        barcode: '1234567890124',
        category: { id: '2', name: 'Beverages' }
      }
    }
  ]

  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Bakery',
      description: 'Fresh baked goods',
      isActive: true,
      productCount: 15
    },
    {
      id: '2',
      name: 'Beverages',
      description: 'Drinks and liquids',
      isActive: true,
      productCount: 28
    },
    {
      id: '3',
      name: 'Snacks',
      description: 'Packaged snacks',
      isActive: true,
      productCount: 42
    }
  ]

  const mockBrands: Brand[] = [
    {
      id: '1',
      name: 'Coca-Cola',
      description: 'Beverage company',
      website: 'https://coca-cola.com',
      isActive: true,
      productCount: 8
    },
    {
      id: '2',
      name: 'Pepsi',
      description: 'Beverage company',
      website: 'https://pepsi.com',
      isActive: true,
      productCount: 6
    }
  ]

  // Load data on component mount
  useEffect(() => {
    console.log('InventoryManagement component mounted')
    // Load data from API and mock data
    const loadData = async () => {
      try {
        // Fetch categories from API
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          const categoriesWithExtras: Category[] = categoriesData.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            isActive: true,
            productCount: 0
          }))
          setCategories(categoriesWithExtras)
          console.log('Categories loaded:', categoriesWithExtras.length)
        } else {
          // Fallback to mock data if API fails
          setCategories(mockCategories)
          console.log('Using mock categories')
        }
      } catch (error) {
        console.error('Error loading categories:', error)
        // Fallback to mock data
        setCategories(mockCategories)
      }

      try {
        // Fetch brands from API
        const brandsResponse = await fetch('/api/brands')
        if (brandsResponse.ok) {
          const brandsData = await brandsResponse.json()
          const brandsWithExtras: Brand[] = brandsData.map((brand: any) => ({
            id: brand.id,
            name: brand.name,
            description: brand.description,
            website: brand.website,
            isActive: true,
            productCount: 0
          }))
          setBrands(brandsWithExtras)
          console.log('Brands loaded:', brandsWithExtras.length)
        } else {
          setBrands(mockBrands)
          console.log('Using mock brands')
        }
      } catch (error) {
        console.error('Error loading brands:', error)
        setBrands(mockBrands)
      }

      // Set mock inventory data
      setInventory(mockInventory)
      console.log('Mock inventory set:', mockInventory.length, 'items')
    }

    loadData()
  }, [])

  // Debug: Monitor dialog state changes
  useEffect(() => {
    console.log('Dialog state changed:', {
      showPrintDialog,
      showPrintPreview,
      printType,
      printSize,
      selectedItemsSize: selectedItems.size
    })
  }, [showPrintDialog, showPrintPreview, printType, printSize, selectedItems.size])

  const filteredInventory = inventory.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = inventory.filter(item => item.quantity <= item.reorderPoint)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-gray-600">
            Manage your inventory with tracking and reordering
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              // Add refresh functionality here if needed
              console.log('Refresh clicked')
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search products, SKUs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                <SelectItem value="1">Main Store</SelectItem>
                <SelectItem value="2">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory.length}</div>
                <p className="text-xs text-gray-500">
                  {inventory.filter(i => i.quantity > 0).length} in stock
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <FileText className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-gray-500">
                  {categories.filter(c => c.isActive).length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Brands</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{brands.length}</div>
                <p className="text-xs text-gray-500">
                  {brands.filter(b => b.isActive).length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {lowStockItems.length}
                </div>
                <p className="text-xs text-gray-500">
                  Need immediate attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems && lowStockItems.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Low Stock Alert ({lowStockItems.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-600">
                          {item.quantity} left (min: {item.minStock})
                        </p>
                      </div>
                      <Badge variant="destructive">Low Stock</Badge>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <p className="text-sm text-red-700">
                      And {lowStockItems.length - 3} more items low on stock...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Quick Print Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="h-5 w-5 mr-2" />
                Quick Print Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    console.log('Barcode button clicked')
                    openPrintDialog('barcode')
                  }}
                  disabled={selectedItems.size === 0}
                  className="flex items-center"
                >
                  <Barcode className="h-4 w-4 mr-2" />
                  Print Barcode/Label
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    console.log('Stock button clicked')
                    openPrintDialog('stock')
                  }}
                  disabled={selectedItems.size === 0}
                  className="flex items-center"
                >
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Print Stock Summary
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    console.log('Details button clicked')
                    openPrintDialog('details')
                  }}
                  disabled={selectedItems.size === 0}
                  className="flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Product Details
                </Button>
                <div className="flex items-center text-sm text-gray-600 ml-4">
                  <span>{selectedItems.size} item(s) selected</span>
                  {selectedItems.size > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        setSelectedItems(new Set())
                      }}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Debug: selectedItems.size = {selectedItems.size}, filteredInventory.length = {filteredInventory.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.size === filteredInventory.length && filteredInventory.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory && filteredInventory.length > 0 ? (
                      filteredInventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-gray-500">{item.product.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.product.sku}</TableCell>
                          <TableCell>{item.product.category?.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.minStock}</TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell>
                            {item.quantity <= item.reorderPoint ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge variant="default">In Stock</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <p className="text-gray-500">No inventory items found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Categories</CardTitle>
                <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="categoryName">Name</Label>
                        <Input
                          id="categoryName"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                          placeholder="Enter category name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryDescription">Description</Label>
                        <Textarea
                          id="categoryDescription"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                          placeholder="Enter category description"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault()
                            setShowCategoryDialog(false)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            handleCategorySubmit()
                          }}
                        >
                          Add Category
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{category.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell>{category.productCount || 0}</TableCell>
                        <TableCell>
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                console.log('Edit category clicked:', category.id)
                                // Add edit functionality here
                              }}
                            >
                              Edit
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

        {/* Brands Tab */}
        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Brands</CardTitle>
                <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Brand
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Brand</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="brandName">Name</Label>
                        <Input
                          id="brandName"
                          value={brandForm.name}
                          onChange={(e) => setBrandForm({...brandForm, name: e.target.value})}
                          placeholder="Enter brand name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brandDescription">Description</Label>
                        <Textarea
                          id="brandDescription"
                          value={brandForm.description}
                          onChange={(e) => setBrandForm({...brandForm, description: e.target.value})}
                          placeholder="Enter brand description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brandWebsite">Website</Label>
                        <Input
                          id="brandWebsite"
                          value={brandForm.website}
                          onChange={(e) => setBrandForm({...brandForm, website: e.target.value})}
                          placeholder="Enter brand website"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault()
                            setShowBrandDialog(false)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            handleBrandSubmit()
                          }}
                        >
                          Add Brand
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{brand.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{brand.description}</TableCell>
                        <TableCell>{brand.website}</TableCell>
                        <TableCell>{brand.productCount || 0}</TableCell>
                        <TableCell>
                          <Badge variant={brand.isActive ? "default" : "secondary"}>
                            {brand.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                console.log('Edit brand clicked:', brand.id)
                                // Add edit functionality here
                              }}
                            >
                              Edit
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
      </Tabs>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-md z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Printer className="h-5 w-5 mr-2" />
              Print {printType === 'barcode' ? 'Barcode/Label' : printType === 'stock' ? 'Stock Summary' : 'Product Details'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="printSize">Label/Paper Size</Label>
              <Select value={printSize} onValueChange={(value: '58mm' | '80mm' | 'a4') => setPrintSize(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (Small Label)</SelectItem>
                  <SelectItem value="80mm">80mm (Standard Receipt)</SelectItem>
                  <SelectItem value="a4">A4 (Full Page)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {printSize === '58mm' ? 'Compact labels for small products' :
                 printSize === '80mm' ? 'Standard receipt size for most printers' :
                 'Full page for detailed reports'}
              </p>
            </div>

            <div>
              <Label>Selected Items</Label>
              <div className="text-sm text-gray-600 mt-1">
                {selectedItems.size} item(s) will be printed
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault()
                  console.log('Cancel button clicked')
                  setShowPrintDialog(false)
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  console.log('Print Preview button clicked')
                  handlePrint()
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Printer className="h-5 w-5 mr-2" />
                Print Preview - {printType === 'barcode' ? 'Barcode/Label' : printType === 'stock' ? 'Stock Summary' : 'Product Details'}
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.preventDefault()
                    handleDownloadPDF()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.preventDefault()
                    window.print()
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div 
              dangerouslySetInnerHTML={{ __html: printPreviewContent }} 
              className="bg-white p-4"
              style={{ minHeight: '400px' }}
            />
          </div>
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <div>
              Paper size: {printSize === '58mm' ? '58mm' : printSize === '80mm' ? '80mm' : 'A4'}
            </div>
            <div>
              Use browser print function (Ctrl+P) to print this document
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InventoryManagement