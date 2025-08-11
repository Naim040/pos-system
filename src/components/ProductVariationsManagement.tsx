"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, Package, Settings, RefreshCw, Copy, Link as LinkIcon, X } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  sku?: string
  hasVariations: boolean
}

interface Attribute {
  id: string
  name: string
  type: string
  options?: string[]
}

interface ProductVariation {
  id: string
  productId: string
  sku?: string
  barcode?: string
  price: number
  stock: number
  imageUrl?: string
  isActive: boolean
  attributes: Array<{
    id: string
    attribute: Attribute
    attributeValue: string
  }>
  inventory?: Array<{
    id: string
    storeId: string
    store: {
      id: string
      name: string
    }
    quantity: number
  }>
}

interface AttributeFormData {
  name: string
  type: string
  options: string[]
}

interface VariationFormData {
  productId: string
  sku?: string
  barcode?: string
  price: number
  stock: number
  imageUrl?: string
  attributes: Array<{
    attributeId: string
    value: string
  }>
}

export default function ProductVariationsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [variations, setVariations] = useState<ProductVariation[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false)
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null)
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null)
  const [formData, setFormData] = useState<VariationFormData>({
    productId: '',
    sku: '',
    barcode: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    attributes: []
  })
  const [attributeFormData, setAttributeFormData] = useState<AttributeFormData>({
    name: '',
    type: 'select',
    options: []
  })
  const [newOption, setNewOption] = useState('')
  const [generatorData, setGeneratorData] = useState({
    attributeIds: [] as string[],
    basePrice: 0,
    priceAdjustments: {} as Record<string, number>
  })

  useEffect(() => {
    fetchProducts()
    fetchAttributes()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchVariations()
    } else {
      setVariations([])
    }
  }, [selectedProduct])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchAttributes = async () => {
    try {
      const response = await fetch('/api/attributes')
      if (response.ok) {
        const data = await response.json()
        setAttributes(data.attributes && Array.isArray(data.attributes) ? data.attributes.map((attr: any) => ({
          ...attr,
          options: attr.options ? JSON.parse(attr.options) : []
        })) : [])
      }
    } catch (error) {
      console.error('Error fetching attributes:', error)
    }
  }

  const fetchVariations = async () => {
    if (!selectedProduct) return

    setLoading(true)
    try {
      const response = await fetch(`/api/product-variations?productId=${selectedProduct}`)
      if (response.ok) {
        const data = await response.json()
        setVariations(data.variations || [])
      }
    } catch (error) {
      console.error('Error fetching variations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingAttribute ? `/api/attributes/${editingAttribute.id}` : '/api/attributes'
      const method = editingAttribute ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...attributeFormData,
          options: JSON.stringify(attributeFormData.options)
        })
      })

      if (response.ok) {
        await fetchAttributes()
        setIsAttributeDialogOpen(false)
        resetAttributeForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save attribute')
      }
    } catch (error) {
      console.error('Error saving attribute:', error)
      alert('Failed to save attribute')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingVariation ? `/api/product-variations/${editingVariation.id}` : '/api/product-variations'
      const method = editingVariation ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchVariations()
        setIsDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save variation')
      }
    } catch (error) {
      console.error('Error saving variation:', error)
      alert('Failed to save variation')
    }
  }

  const handleGenerateVariations = async () => {
    try {
      const response = await fetch('/api/product-variations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          attributeIds: generatorData.attributeIds,
          basePrice: generatorData.basePrice,
          priceAdjustments: generatorData.priceAdjustments
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Generated ${data.newVariations.length} variations successfully`)
        await fetchVariations()
        setIsGeneratorOpen(false)
        setGeneratorData({
          attributeIds: [],
          basePrice: 0,
          priceAdjustments: {}
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate variations')
      }
    } catch (error) {
      console.error('Error generating variations:', error)
      alert('Failed to generate variations')
    }
  }

  const handleEditVariation = (variation: ProductVariation) => {
    setEditingVariation(variation)
    setFormData({
      productId: variation.productId,
      sku: variation.sku || '',
      barcode: variation.barcode || '',
      price: variation.price,
      stock: variation.stock,
      imageUrl: variation.imageUrl || '',
      attributes: variation.attributes && Array.isArray(variation.attributes) ? variation.attributes.map(attr => ({
        attributeId: attr.attribute?.id || '',
        value: attr.attributeValue || ''
      })) : []
    })
    setIsDialogOpen(true)
  }

  const handleEditAttribute = (attribute: Attribute) => {
    setEditingAttribute(attribute)
    setAttributeFormData({
      name: attribute.name,
      type: attribute.type,
      options: attribute.options || []
    })
    setIsAttributeDialogOpen(true)
  }

  const handleDeleteVariation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variation?')) return

    try {
      const response = await fetch(`/api/product-variations/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchVariations()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete variation')
      }
    } catch (error) {
      console.error('Error deleting variation:', error)
      alert('Failed to delete variation')
    }
  }

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attribute? This will affect all products using this attribute.')) return

    try {
      const response = await fetch(`/api/attributes/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchAttributes()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete attribute')
      }
    } catch (error) {
      console.error('Error deleting attribute:', error)
      alert('Failed to delete attribute')
    }
  }

  const resetForm = () => {
    setEditingVariation(null)
    setFormData({
      productId: selectedProduct,
      sku: '',
      barcode: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      attributes: []
    })
  }

  const resetAttributeForm = () => {
    setEditingAttribute(null)
    setAttributeFormData({
      name: '',
      type: 'select',
      options: []
    })
    setNewOption('')
  }

  const addOption = () => {
    if (newOption.trim() && !attributeFormData.options.includes(newOption.trim())) {
      setAttributeFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }))
      setNewOption('')
    }
  }

  const removeOption = (option: string) => {
    setAttributeFormData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt !== option)
    }))
  }

  const getAttributeOptions = (attributeId: string) => {
    const attribute = attributes.find(attr => attr.id === attributeId)
    return attribute?.options || []
  }

  const getVariationDisplayName = (variation: ProductVariation) => {
    if (!variation.attributes || !Array.isArray(variation.attributes) || variation.attributes.length === 0) return 'Base Product'
    return variation.attributes
      .map(attr => `${attr.attribute?.name || 'Unknown'}: ${attr.attributeValue || 'Unknown'}`)
      .join(', ')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const getAvailableAttributes = () => {
    if (!attributes || !Array.isArray(attributes)) return []
    return attributes.filter(attr => attr.type === 'select' && attr.options && attr.options.length > 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Variations</h1>
          <p className="text-muted-foreground">
            Manage product variations with custom attributes
          </p>
        </div>
      </div>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Product</CardTitle>
          <CardDescription>Choose a product to manage its variations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products && Array.isArray(products) && products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} {product.sku && `(${product.sku})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProduct && (
        <Tabs defaultValue="variations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
            <TabsTrigger value="variations">Variations</TabsTrigger>
            <TabsTrigger value="generator">Generator</TabsTrigger>
          </TabsList>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Attributes</CardTitle>
                    <CardDescription>
                      Manage reusable attributes like Size, Color, Weight, etc.
                    </CardDescription>
                  </div>
                  <Dialog open={isAttributeDialogOpen} onOpenChange={setIsAttributeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetAttributeForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Attribute
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAttribute ? 'Edit Attribute' : 'Add New Attribute'}
                        </DialogTitle>
                        <DialogDescription>
                          Create or modify a product attribute
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAttributeSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="attributeName">Attribute Name</Label>
                            <Input
                              id="attributeName"
                              value={attributeFormData.name}
                              onChange={(e) => setAttributeFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Size, Color, Weight"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="attributeType">Type</Label>
                            <Select 
                              value={attributeFormData.type} 
                              onValueChange={(value) => setAttributeFormData(prev => ({ ...prev, type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="select">Select</SelectItem>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {attributeFormData.type === 'select' && (
                          <div>
                            <Label>Attribute Values</Label>
                            <div className="space-y-2 mt-2">
                              <div className="flex gap-2">
                                <Input
                                  value={newOption}
                                  onChange={(e) => setNewOption(e.target.value)}
                                  placeholder="Add new value"
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                                />
                                <Button type="button" onClick={addOption}>Add</Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {attributeFormData.options.map((option, index) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {option}
                                    <X 
                                      className="h-3 w-3 cursor-pointer" 
                                      onClick={() => removeOption(option)}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsAttributeDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingAttribute ? 'Update' : 'Create'} Attribute
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {attributes.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No attributes found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first attribute to start building product variations
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Values</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attributes.map((attribute) => (
                        <TableRow key={attribute.id}>
                          <TableCell className="font-medium">{attribute.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{attribute.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {attribute.options && Array.isArray(attribute.options) ? attribute.options.map((option, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {option}
                                </Badge>
                              )) : (
                                <span className="text-muted-foreground text-sm">No values</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAttribute(attribute)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAttribute(attribute.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variations Tab */}
          <TabsContent value="variations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Variations</CardTitle>
                    <CardDescription>
                      Manage variations for the selected product
                    </CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Variation
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingVariation ? 'Edit Variation' : 'Add New Variation'}
                        </DialogTitle>
                        <DialogDescription>
                          Create or modify a product variation
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="sku">SKU</Label>
                            <Input
                              id="sku"
                              value={formData.sku}
                              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                              placeholder="Unique SKU"
                            />
                          </div>
                          <div>
                            <Label htmlFor="barcode">Barcode</Label>
                            <Input
                              id="barcode"
                              value={formData.barcode}
                              onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                              placeholder="Barcode"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="price">Price</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={formData.price}
                              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="stock">Stock</Label>
                            <Input
                              id="stock"
                              type="number"
                              value={formData.stock}
                              onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                              placeholder="0"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Attributes</Label>
                          <div className="space-y-3 mt-2">
                            {getAvailableAttributes().map((attribute) => (
                              <div key={attribute.id}>
                                <Label className="text-sm">{attribute.name}</Label>
                                <Select
                                  value={formData.attributes.find(a => a.attributeId === attribute.id)?.value || ''}
                                  onValueChange={(value) => {
                                    const existing = formData.attributes.find(a => a.attributeId === attribute.id)
                                    if (existing) {
                                      setFormData(prev => ({
                                        ...prev,
                                        attributes: prev.attributes.map(a => 
                                          a.attributeId === attribute.id ? { ...a, value } : a
                                        )
                                      }))
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        attributes: [...prev.attributes, { attributeId: attribute.id, value }]
                                      }))
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Select ${attribute.name}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {attribute.options?.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingVariation ? 'Update' : 'Create'} Variation
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading variations...</div>
                ) : variations.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No variations found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first variation or generate multiple variations automatically
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Variation
                      </Button>
                      <Button variant="outline" onClick={() => setIsGeneratorOpen(true)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate Variations
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variation</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Attributes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variations && Array.isArray(variations) && variations.map((variation) => (
                        <TableRow key={variation.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{getVariationDisplayName(variation)}</div>
                              {variation.imageUrl && (
                                <img 
                                  src={variation.imageUrl} 
                                  alt={getVariationDisplayName(variation)}
                                  className="w-8 h-8 rounded mt-1 object-cover"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {variation.sku || '-'}
                              {variation.sku && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(variation.sku!)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>${variation.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={variation.stock > 0 ? 'default' : 'destructive'}>
                              {variation.stock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {variation.attributes && Array.isArray(variation.attributes) && variation.attributes.map((attr) => (
                                <Badge key={attr.id} variant="outline" className="text-xs">
                                  {attr.attribute?.name || 'Unknown'}: {attr.attributeValue || 'Unknown'}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditVariation(variation)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteVariation(variation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generator Tab */}
          <TabsContent value="generator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Variations</CardTitle>
                <CardDescription>
                  Automatically generate all possible combinations based on selected attributes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label>Base Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={generatorData.basePrice}
                      onChange={(e) => setGeneratorData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label>Select Attributes</Label>
                    <div className="space-y-2 mt-2">
                      {getAvailableAttributes().map((attribute) => (
                        <div key={attribute.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={attribute.id}
                            checked={generatorData.attributeIds.includes(attribute.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGeneratorData(prev => ({
                                  ...prev,
                                  attributeIds: [...prev.attributeIds, attribute.id]
                                }))
                              } else {
                                setGeneratorData(prev => ({
                                  ...prev,
                                  attributeIds: prev.attributeIds.filter(id => id !== attribute.id)
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={attribute.id}>{attribute.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {generatorData.attributeIds.length > 0 && (
                    <div>
                      <Label>Price Adjustments (Optional)</Label>
                      <div className="space-y-2 mt-2">
                        {generatorData.attributeIds.map((attributeId) => {
                          const attribute = attributes.find(attr => attr.id === attributeId)
                          if (!attribute) return null
                          
                          return (
                            <div key={attributeId} className="space-y-1">
                              <Label className="text-sm">{attribute.name}</Label>
                              {attribute.options?.map((option) => (
                                <div key={option} className="flex items-center gap-2">
                                  <Label className="text-xs w-20">{option}</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={generatorData.priceAdjustments[`${attributeId}:${option}`] || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0
                                      setGeneratorData(prev => ({
                                        ...prev,
                                        priceAdjustments: {
                                          ...prev.priceAdjustments,
                                          [`${attributeId}:${option}`]: value
                                        }
                                      }))
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleGenerateVariations} disabled={generatorData.attributeIds.length === 0}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Variations
                    </Button>
                    <Button variant="outline" onClick={() => setIsGeneratorOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}