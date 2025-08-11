"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  FolderOpen, 
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  Hash,
  Code,
  Layers
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  code?: string
  level: number
  hsCode?: string
  googleTaxonomyId?: string
  isActive: boolean
  sortOrder: number
  productCount: number
  parent?: Category | null
  children?: Category[]
  createdAt: string
  updatedAt: string
}

interface CategoryFormData {
  name: string
  description: string
  code?: string
  parentId?: string
  level?: number
  hsCode?: string
  googleTaxonomyId?: string
  isActive: boolean
  sortOrder: number
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    code: '',
    parentId: 'root',
    level: 1,
    hsCode: '',
    googleTaxonomyId: '',
    isActive: true,
    sortOrder: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    filterCategories()
  }, [categories, searchTerm])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        // Auto-expand first level categories
        const firstLevelIds = data
          .filter((cat: Category) => cat.level === 1)
          .map((cat: Category) => cat.id)
        setExpandedCategories(new Set(firstLevelIds))
      } else {
        throw new Error('Failed to load categories')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterCategories = () => {
    if (!searchTerm) {
      setFilteredCategories(categories)
      return
    }

    const searchInCategory = (category: Category): boolean => {
      const matchesSearch = 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (category.code && category.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (category.hsCode && category.hsCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (category.googleTaxonomyId && category.googleTaxonomyId.toLowerCase().includes(searchTerm.toLowerCase()))

      if (matchesSearch) return true
      
      if (category.children) {
        return category.children.some(searchInCategory)
      }
      
      return false
    }

    const filtered = categories.filter(searchInCategory)
    setFilteredCategories(filtered)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name must be less than 50 characters'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    if (formData.code && formData.code.length > 20) {
      newErrors.code = 'Code must be less than 20 characters'
    }

    if (formData.hsCode && formData.hsCode.length > 20) {
      newErrors.hsCode = 'HS Code must be less than 20 characters'
    }

    if (formData.googleTaxonomyId && formData.googleTaxonomyId.length > 20) {
      newErrors.googleTaxonomyId = 'Google Taxonomy ID must be less than 20 characters'
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
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      
      // Convert 'root' to null for the API
      const submitData = {
        ...formData,
        parentId: formData.parentId === 'root' ? null : formData.parentId
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const savedCategory = await response.json()
        
        if (editingCategory) {
          setCategories(prev => {
            const updateCategory = (cats: Category[]): Category[] => {
              return cats.map(cat => {
                if (cat.id === editingCategory.id) {
                  return { ...cat, ...savedCategory }
                }
                if (cat.children) {
                  return { ...cat, children: updateCategory(cat.children) }
                }
                return cat
              })
            }
            return updateCategory(prev)
          })
          toast({
            title: "Category updated",
            description: `${savedCategory.name} has been updated successfully`,
          })
        } else {
          setCategories(prev => [...prev, savedCategory])
          toast({
            title: "Category created",
            description: `${savedCategory.name} has been created successfully`,
          })
        }
        
        resetForm()
        setIsDialogOpen(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save category')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      code: category.code || '',
      parentId: category.parent?.id || 'root',
      level: category.level,
      hsCode: category.hsCode || '',
      googleTaxonomyId: category.googleTaxonomyId || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder
    })
    setErrors({})
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return

    setLoading(true)
    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCategories(prev => {
          const removeCategory = (cats: Category[]): Category[] => {
            return cats.filter(cat => {
              if (cat.id === categoryToDelete.id) {
                return false
              }
              if (cat.children) {
                return { ...cat, children: removeCategory(cat.children) }
              }
              return true
            })
          }
          return removeCategory(prev)
        })
        toast({
          title: "Category deleted",
          description: `${categoryToDelete.name} has been deleted successfully`,
        })
        setDeleteDialogOpen(false)
        setCategoryToDelete(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      parentId: 'root',
      level: 1,
      hsCode: '',
      googleTaxonomyId: '',
      isActive: true,
      sortOrder: 0
    })
    setErrors({})
    setEditingCategory(null)
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    setIsDialogOpen(open)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const getStatusBadge = (productCount: number) => {
    if (productCount === 0) {
      return <Badge variant="secondary">Empty</Badge>
    } else if (productCount < 10) {
      return <Badge variant="outline">Low</Badge>
    } else if (productCount < 50) {
      return <Badge variant="default">Medium</Badge>
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">High</Badge>
    }
  }

  const getLevelBadge = (level: number) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800']
    const labels = ['Main', 'Sub', 'Sub-Sub']
    return (
      <Badge variant="outline" className={colors[level - 1] || colors[0]}>
        {labels[level - 1] || `Level ${level}`}
      </Badge>
    )
  }

  const flattenCategories = (categories: Category[]): Category[] => {
    const result: Category[] = []
    
    const flatten = (cats: Category[], depth: number = 0) => {
      cats.forEach(cat => {
        result.push({ ...cat, depth })
        if (cat.children && expandedCategories.has(cat.id)) {
          flatten(cat.children, depth + 1)
        }
      })
    }
    
    flatten(categories)
    return result
  }

  const renderCategoryRow = (category: Category) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    
    return (
      <Card key={category.id} className={`relative hover:shadow-md transition-shadow ${category.depth > 0 ? 'ml-6' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategory(category.id)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {!hasChildren && category.depth > 0 && (
                <div className="h-6 w-6" />
              )}
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {getLevelBadge(category.level)}
                {getStatusBadge(category.productCount)}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(category)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => confirmDelete(category)}
                disabled={category.productCount > 0}
                className={category.productCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {category.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {category.description}
            </p>
          )}
          
          {/* International Classification Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {category.code && (
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Code:</span>
                <span className="text-gray-600">{category.code}</span>
              </div>
            )}
            {category.hsCode && (
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="font-medium">HS Code:</span>
                <span className="text-gray-600">{category.hsCode}</span>
              </div>
            )}
            {category.googleTaxonomyId && (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Google Taxonomy:</span>
                <span className="text-gray-600">{category.googleTaxonomyId}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Package className="h-4 w-4" />
              <span>{category.productCount} products</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Sort Order: {category.sortOrder}</span>
              <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getParentOptions = () => {
    const options: { value: string; label: string; level: number }[] = [
      { value: 'root', label: 'None (Root Level)', level: 0 }
    ]
    
    const addOptions = (cats: Category[], depth: number = 0) => {
      cats.forEach(cat => {
        if (cat.level < 3) { // Only allow up to sub-subcategories
          const indent = '  '.repeat(depth)
          options.push({
            value: cat.id,
            label: `${indent}${cat.name}`,
            level: cat.level
          })
          if (cat.children) {
            addOptions(cat.children, depth + 1)
          }
        }
      })
    }
    
    addOptions(categories)
    return options
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-gray-600">Manage product categories with global standards and hierarchical structure</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryName">Category Name *</Label>
                  <Input
                    id="categoryName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="categoryCode">Category Code</Label>
                  <Input
                    id="categoryCode"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g., GROCERY, ELECTRONICS"
                    className={errors.code ? 'border-red-500' : ''}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea
                  id="categoryDescription"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description (optional)"
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentCategory">Parent Category</Label>
                  <Select value={formData.parentId} onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {getParentOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  International Classification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hsCode">HS Code</Label>
                    <Input
                      id="hsCode"
                      value={formData.hsCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value }))}
                      placeholder="e.g., 0801-0814"
                      className={errors.hsCode ? 'border-red-500' : ''}
                    />
                    {errors.hsCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.hsCode}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="googleTaxonomyId">Google Taxonomy ID</Label>
                    <Input
                      id="googleTaxonomyId"
                      value={formData.googleTaxonomyId}
                      onChange={(e) => setFormData(prev => ({ ...prev, googleTaxonomyId: e.target.value }))}
                      placeholder="e.g., 166"
                      className={errors.googleTaxonomyId ? 'border-red-500' : ''}
                    />
                    {errors.googleTaxonomyId && (
                      <p className="text-red-500 text-sm mt-1">{errors.googleTaxonomyId}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search categories by name, description, code, HS code, or taxonomy ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {flattenCategories(filteredCategories).length} categories
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Categories Hierarchical List */}
      {loading && categories.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {flattenCategories(filteredCategories).map(renderCategoryRow)}
        </div>
      )}

      {flattenCategories(filteredCategories).length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No categories found' : 'No categories yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create your first category to organize your products'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              Delete Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {categoryToDelete && (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This action cannot be undone. This will permanently delete the category 
                    "{categoryToDelete.name}".
                  </AlertDescription>
                </Alert>
                
                {categoryToDelete.productCount > 0 && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      This category contains {categoryToDelete.productCount} products and cannot be deleted. 
                      Please move or delete the products first.
                    </AlertDescription>
                  </Alert>
                )}
                
                {categoryToDelete.children && categoryToDelete.children.length > 0 && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      This category has {categoryToDelete.children.length} subcategories and cannot be deleted. 
                      Please delete or move the subcategories first.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={loading || categoryToDelete.productCount > 0 || (categoryToDelete.children && categoryToDelete.children.length > 0)}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}