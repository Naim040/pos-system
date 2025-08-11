"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Search, Package, Upload, Download, X, Image as ImageIcon } from 'lucide-react'
import { formatPrice } from '@/lib/currency'
import BarcodeScanner from '@/components/BarcodeScanner'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku?: string
  barcode?: string
  imageUrl?: string
  categoryId?: string
  brandId?: string
  supplierId?: string
  unit?: string
  purchasePrice?: number
  wholesalePrice?: number
  discount?: number
  taxRate?: number
  mrp?: number
  warranty?: string
  isReturnable?: boolean
  isSerialized?: boolean
  isBatched?: boolean
  hasVariations?: boolean
  isActive?: boolean
  showInPOS?: boolean
  showInEcommerce?: boolean
  category?: {
    id: string
    name: string
  }
  brand?: {
    id: string
    name: string
  }
  supplier?: {
    id: string
    name: string
  }
  inventory?: {
    id: string
    quantity: number
    minStock: number
    maxStock?: number
    location?: string
    aisle?: string
    shelf?: string
    bin?: string
    batchNumber?: string
    expiryDate?: string
    costPrice?: number
  }
  tags?: string[]
  images?: string[]
}

interface Category {
  id: string
  name: string
  description?: string
}

interface Brand {
  id: string
  name: string
  description?: string
  logoUrl?: string
}

interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
}

interface ProductFormData {
  name: string
  description: string
  price: string
  sku: string
  barcode: string
  categoryId: string
  brandId: string
  supplierId: string
  unit: string
  purchasePrice: string
  wholesalePrice: string
  discount: string
  taxRate: string
  mrp: string
  warranty: string
  isReturnable: boolean
  isSerialized: boolean
  isBatched: boolean
  hasVariations: boolean
  isActive: boolean
  showInPOS: boolean
  showInEcommerce: boolean
  images: string[]
  tags: string
  openingStock: string
  minStockAlert: string
  stockLocation: string
  warehouse: string
  expiryDate: string
  batchNumber: string
  purchaseLink: string
}

interface InventoryFormData {
  quantity: number
  minStock: number
  maxStock?: number
  location?: string
  aisle?: string
  shelf?: string
  bin?: string
  batchNumber?: string
  expiryDate?: string
  costPrice?: number
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    supplierId: '',
    unit: 'pcs',
    purchasePrice: '',
    wholesalePrice: '',
    discount: '',
    taxRate: '',
    mrp: '',
    warranty: '',
    isReturnable: true,
    isSerialized: false,
    isBatched: false,
    hasVariations: false,
    isActive: true,
    showInPOS: true,
    showInEcommerce: false,
    images: [],
    tags: '',
    openingStock: '0',
    minStockAlert: '0',
    stockLocation: '',
    warehouse: '',
    expiryDate: '',
    batchNumber: '',
    purchaseLink: ''
  })
  const [inventoryData, setInventoryData] = useState<InventoryFormData>({
    quantity: 0,
    minStock: 0,
    maxStock: undefined,
    location: '',
    aisle: '',
    shelf: '',
    bin: '',
    batchNumber: '',
    expiryDate: '',
    costPrice: 0
  })
  const [newTag, setNewTag] = useState('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const { toast } = useToast()

  const units = [
    'pcs', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'gal', 'fl oz', 
    'm', 'cm', 'mm', 'inch', 'ft', 'yd', 'sq m', 'sq ft',
    'pack', 'box', 'carton', 'pallet', 'roll', 'set', 'pair'
  ]

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchBrands()
    fetchSuppliers()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data)
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        categoryId: formData.categoryId || null,
        brandId: formData.brandId || null,
        supplierId: formData.supplierId || null,
        unit: formData.unit,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null,
        discount: formData.discount ? parseFloat(formData.discount) : null,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : null,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        warranty: formData.warranty || null,
        isReturnable: formData.isReturnable,
        isSerialized: formData.isSerialized,
        isBatched: formData.isBatched,
        hasVariations: formData.hasVariations,
        isActive: formData.isActive,
        showInPOS: formData.showInPOS,
        showInEcommerce: formData.showInEcommerce,
        images: formData.images.length > 0 ? formData.images : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        const product = await response.json()
        
        // Create inventory record
        const inventoryPayload = {
          quantity: parseInt(formData.openingStock) || 0,
          minStock: parseInt(formData.minStockAlert) || 0,
          maxStock: inventoryData.maxStock,
          location: formData.stockLocation || inventoryData.location,
          aisle: inventoryData.aisle,
          shelf: inventoryData.shelf,
          bin: inventoryData.bin,
          batchNumber: formData.batchNumber || inventoryData.batchNumber,
          expiryDate: formData.expiryDate || inventoryData.expiryDate,
          costPrice: inventoryData.costPrice || (formData.purchasePrice ? parseFloat(formData.purchasePrice) : 0)
        }

        await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product.id,
            ...inventoryPayload
          }),
        })

        toast({
          title: editingProduct ? "Product updated" : "Product created",
          description: `${formData.name} has been ${editingProduct ? 'updated' : 'created'} successfully`,
        })
        
        fetchProducts()
        setIsDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      sku: product.sku || '',
      barcode: product.barcode || '',
      categoryId: product.category?.id || '',
      brandId: product.brand?.id || '',
      supplierId: product.supplier?.id || '',
      unit: product.unit || 'pcs',
      purchasePrice: product.purchasePrice?.toString() || '',
      wholesalePrice: product.wholesalePrice?.toString() || '',
      discount: product.discount?.toString() || '',
      taxRate: product.taxRate?.toString() || '',
      mrp: product.mrp?.toString() || '',
      warranty: product.warranty || '',
      isReturnable: product.isReturnable ?? true,
      isSerialized: product.isSerialized ?? false,
      isBatched: product.isBatched ?? false,
      hasVariations: product.hasVariations ?? false,
      isActive: product.isActive ?? true,
      showInPOS: product.showInPOS ?? true,
      showInEcommerce: product.showInEcommerce ?? false,
      images: product.images || [],
      tags: product.tags?.join(', ') || '',
      openingStock: product.inventory?.quantity?.toString() || '0',
      minStockAlert: product.inventory?.minStock?.toString() || '0',
      stockLocation: product.inventory?.location || '',
      warehouse: '',
      expiryDate: product.inventory?.expiryDate ? new Date(product.inventory.expiryDate).toISOString().split('T')[0] : '',
      batchNumber: product.inventory?.batchNumber || '',
      purchaseLink: ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Product deleted",
          description: "Product has been deleted successfully",
        })
        fetchProducts()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      sku: '',
      barcode: '',
      categoryId: '',
      brandId: '',
      supplierId: '',
      unit: 'pcs',
      purchasePrice: '',
      wholesalePrice: '',
      discount: '',
      taxRate: '',
      mrp: '',
      warranty: '',
      isReturnable: true,
      isSerialized: false,
      isBatched: false,
      hasVariations: false,
      isActive: true,
      showInPOS: true,
      showInEcommerce: false,
      images: [],
      tags: '',
      openingStock: '0',
      minStockAlert: '0',
      stockLocation: '',
      warehouse: '',
      expiryDate: '',
      batchNumber: '',
      purchaseLink: ''
    })
    setInventoryData({
      quantity: 0,
      minStock: 0,
      maxStock: undefined,
      location: '',
      aisle: '',
      shelf: '',
      bin: '',
      batchNumber: '',
      expiryDate: '',
      costPrice: 0
    })
    setNewTag('')
    setImagePreview('')
  }

  const addImage = (url: string) => {
    if (url && !formData.images.includes(url)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }))
    }
  }

  const removeImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== url)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const currentTags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      currentTags.push(newTag.trim())
      setFormData(prev => ({
        ...prev,
        tags: currentTags.join(', ')
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove)
    setFormData(prev => ({
      ...prev,
      tags: updatedTags.join(', ')
    }))
  }

  const handleBulkImport = () => {
    // Placeholder for bulk import functionality
    toast({
      title: "Bulk Import",
      description: "Bulk import functionality will be implemented soon",
    })
  }

  const downloadTemplate = () => {
    // Placeholder for template download
    toast({
      title: "Template Download",
      description: "Template download will be implemented soon",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Product Management</h2>
          <p className="text-gray-600">Manage your product catalog with international standards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button variant="outline" onClick={handleBulkImport}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogDescription>
                  Create or modify product information following international standards
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="supplier">Supplier</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sku">SKU / Product Code</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          placeholder="Unique product code"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="barcode">Barcode</Label>
                        <BarcodeScanner
                          onBarcodeDetected={(barcode) => setFormData({ ...formData, barcode })}
                          enabled={true}
                          compact={true}
                          showManualInput={true}
                          className="mb-2"
                        />
                        <Input
                          id="barcode"
                          value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          placeholder="Scan barcode or enter manually"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="brand">Brand</Label>
                        <Select value={formData.brandId} onValueChange={(value) => setFormData({ ...formData, brandId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit of Measurement</Label>
                        <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Product description..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Product Images</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={imagePreview}
                            onChange={(e) => setImagePreview(e.target.value)}
                            placeholder="Enter image URL"
                          />
                          <Button type="button" onClick={() => addImage(imagePreview)}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={image} 
                                alt={`Product ${index + 1}`}
                                className="w-16 h-16 rounded object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(image)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Product Type</Label>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="hasVariations"
                            checked={formData.hasVariations}
                            onCheckedChange={(checked) => setFormData({ ...formData, hasVariations: checked })}
                          />
                          <Label htmlFor="hasVariations">Variable Product</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isSerialized"
                            checked={formData.isSerialized}
                            onCheckedChange={(checked) => setFormData({ ...formData, isSerialized: checked })}
                          />
                          <Label htmlFor="isSerialized">Serialized</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isBatched"
                            checked={formData.isBatched}
                            onCheckedChange={(checked) => setFormData({ ...formData, isBatched: checked })}
                          />
                          <Label htmlFor="isBatched">Batch Tracking</Label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Tags</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.split(',').map((tag, index) => tag.trim() && (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {tag.trim()}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeTag(tag.trim())}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Pricing Tab */}
                  <TabsContent value="pricing" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Selling Price *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchasePrice">Purchase Price</Label>
                        <Input
                          id="purchasePrice"
                          type="number"
                          step="0.01"
                          value={formData.purchasePrice}
                          onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                        <Input
                          id="wholesalePrice"
                          type="number"
                          step="0.01"
                          value={formData.wholesalePrice}
                          onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mrp">MRP (Maximum Retail Price)</Label>
                        <Input
                          id="mrp"
                          type="number"
                          step="0.01"
                          value={formData.mrp}
                          onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="taxRate">Tax Rate (%)</Label>
                        <Input
                          id="taxRate"
                          type="number"
                          step="0.01"
                          value={formData.taxRate}
                          onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="warranty">Warranty</Label>
                      <Input
                        id="warranty"
                        value={formData.warranty}
                        onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                        placeholder="e.g., 1 year, 6 months, etc."
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isReturnable"
                        checked={formData.isReturnable}
                        onCheckedChange={(checked) => setFormData({ ...formData, isReturnable: checked })}
                      />
                      <Label htmlFor="isReturnable">Returnable</Label>
                    </div>
                  </TabsContent>

                  {/* Inventory Tab */}
                  <TabsContent value="inventory" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="openingStock">Opening Stock</Label>
                        <Input
                          id="openingStock"
                          type="number"
                          value={formData.openingStock}
                          onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="minStockAlert">Minimum Stock Alert</Label>
                        <Input
                          id="minStockAlert"
                          type="number"
                          value={formData.minStockAlert}
                          onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stockLocation">Stock Location</Label>
                        <Input
                          id="stockLocation"
                          value={formData.stockLocation}
                          onChange={(e) => setFormData({ ...formData, stockLocation: e.target.value })}
                          placeholder="e.g., Warehouse A, Section B"
                        />
                      </div>
                      <div>
                        <Label htmlFor="warehouse">Warehouse</Label>
                        <Input
                          id="warehouse"
                          value={formData.warehouse}
                          onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                          placeholder="Main warehouse, Branch warehouse, etc."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="batchNumber">Batch Number</Label>
                        <Input
                          id="batchNumber"
                          value={formData.batchNumber}
                          onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="aisle">Aisle</Label>
                        <Input
                          id="aisle"
                          value={inventoryData.aisle}
                          onChange={(e) => setInventoryData({ ...inventoryData, aisle: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shelf">Shelf</Label>
                        <Input
                          id="shelf"
                          value={inventoryData.shelf}
                          onChange={(e) => setInventoryData({ ...inventoryData, shelf: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bin">Bin</Label>
                        <Input
                          id="bin"
                          value={inventoryData.bin}
                          onChange={(e) => setInventoryData({ ...inventoryData, bin: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxStock">Maximum Stock</Label>
                        <Input
                          id="maxStock"
                          type="number"
                          value={inventoryData.maxStock || ''}
                          onChange={(e) => setInventoryData({ ...inventoryData, maxStock: e.target.value ? parseInt(e.target.value) : undefined })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Supplier Tab */}
                  <TabsContent value="supplier" className="space-y-4">
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="purchaseLink">Purchase Link</Label>
                      <Input
                        id="purchaseLink"
                        type="url"
                        value={formData.purchaseLink}
                        onChange={(e) => setFormData({ ...formData, purchaseLink: e.target.value })}
                        placeholder="https://example.com/product-link"
                      />
                    </div>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Active Status</Label>
                          <p className="text-sm text-muted-foreground">Enable or disable this product</p>
                        </div>
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show in POS</Label>
                          <p className="text-sm text-muted-foreground">Display this product in POS system</p>
                        </div>
                        <Switch
                          checked={formData.showInPOS}
                          onCheckedChange={(checked) => setFormData({ ...formData, showInPOS: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show in E-commerce</Label>
                          <p className="text-sm text-muted-foreground">Display this product in online store</p>
                        </div>
                        <Switch
                          checked={formData.showInEcommerce}
                          onCheckedChange={(checked) => setFormData({ ...formData, showInEcommerce: checked })}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search products by name, SKU, or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant="outline">{formatPrice(product.price)}</Badge>
                </div>
                {product.category && (
                  <Badge variant="secondary" className="text-xs">
                    {product.category.name}
                  </Badge>
                )}
                {product.brand && (
                  <Badge variant="outline" className="text-xs">
                    {product.brand.name}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  {product.sku && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">SKU:</span>
                      <span>{product.sku}</span>
                    </div>
                  )}
                  {product.barcode && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Barcode:</span>
                      <span>{product.barcode}</span>
                    </div>
                  )}
                  {product.unit && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Unit:</span>
                      <span>{product.unit}</span>
                    </div>
                  )}
                  {product.inventory && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stock:</span>
                      <span className={product.inventory.quantity <= product.inventory.minStock ? 'text-red-600 font-medium' : ''}>
                        {product.inventory.quantity} units
                      </span>
                    </div>
                  )}
                  {product.supplier && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Supplier:</span>
                      <span>{product.supplier.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {product.isActive && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                  {product.showInPOS && (
                    <Badge variant="secondary" className="text-xs">POS</Badge>
                  )}
                  {product.showInEcommerce && (
                    <Badge variant="outline" className="text-xs">E-commerce</Badge>
                  )}
                  {product.hasVariations && (
                    <Badge variant="outline" className="text-xs">Variable</Badge>
                  )}
                  {product.isSerialized && (
                    <Badge variant="outline" className="text-xs">Serialized</Badge>
                  )}
                  {product.isBatched && (
                    <Badge variant="outline" className="text-xs">Batched</Badge>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(product.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No products found</p>
            <p className="text-sm">Create your first product to get started</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}