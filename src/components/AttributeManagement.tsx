"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, Settings, Tag } from 'lucide-react'

interface Attribute {
  id: string
  name: string
  type: string
  description?: string
  isRequired: boolean
  isFilterable: boolean
  options?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  productAttributes?: any[]
  variationAttributes?: any[]
}

interface AttributeFormData {
  name: string
  type: string
  description?: string
  isRequired: boolean
  isFilterable: boolean
  options?: string[]
}

export default function AttributeManagement() {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null)
  const [formData, setFormData] = useState<AttributeFormData>({
    name: '',
    type: 'text',
    description: '',
    isRequired: false,
    isFilterable: true,
    options: []
  })
  const [newOption, setNewOption] = useState('')

  useEffect(() => {
    fetchAttributes()
  }, [])

  const fetchAttributes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/attributes')
      if (response.ok) {
        const data = await response.json()
        setAttributes(data.attributes.map((attr: any) => ({
          ...attr,
          options: attr.options ? JSON.parse(attr.options) : []
        })))
      }
    } catch (error) {
      console.error('Error fetching attributes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingAttribute ? `/api/attributes/${editingAttribute.id}` : '/api/attributes'
      const method = editingAttribute ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchAttributes()
        setIsDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save attribute')
      }
    } catch (error) {
      console.error('Error saving attribute:', error)
      alert('Failed to save attribute')
    }
  }

  const handleEdit = (attribute: Attribute) => {
    setEditingAttribute(attribute)
    setFormData({
      name: attribute.name,
      type: attribute.type,
      description: attribute.description || '',
      isRequired: attribute.isRequired,
      isFilterable: attribute.isFilterable,
      options: attribute.options || []
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attribute?')) return

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
    setEditingAttribute(null)
    setFormData({
      name: '',
      type: 'text',
      description: '',
      isRequired: false,
      isFilterable: true,
      options: []
    })
    setNewOption('')
  }

  const addOption = () => {
    if (newOption.trim() && !formData.options?.includes(newOption.trim())) {
      setFormData(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption.trim()]
      }))
      setNewOption('')
    }
  }

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }))
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800'
      case 'number': return 'bg-green-100 text-green-800'
      case 'select': return 'bg-purple-100 text-purple-800'
      case 'boolean': return 'bg-orange-100 text-orange-800'
      case 'date': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attribute Management</h1>
          <p className="text-muted-foreground">
            Create and manage custom attributes for products
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Attribute
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAttribute ? 'Edit Attribute' : 'Create New Attribute'}
              </DialogTitle>
              <DialogDescription>
                Define custom attributes that can be used across products
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Attribute Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Color, Size, Material"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="select">Select (Dropdown)</SelectItem>
                      <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this attribute"
                />
              </div>

              {formData.type === 'select' && (
                <div>
                  <Label>Options *</Label>
                  <div className="space-y-2">
                    {formData.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={option} readOnly />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Add new option"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      />
                      <Button type="button" onClick={addOption}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRequired"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: checked }))}
                  />
                  <Label htmlFor="isRequired">Required for products</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFilterable"
                    checked={formData.isFilterable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFilterable: checked }))}
                  />
                  <Label htmlFor="isFilterable">Available for filtering</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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

      {/* Attributes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Custom Attributes
          </CardTitle>
          <CardDescription>
            Manage attributes that can be assigned to products and variations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading attributes...</div>
          ) : attributes.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No attributes found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom attribute to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Attribute
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Filterable</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributes.map((attribute) => (
                  <TableRow key={attribute.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{attribute.name}</div>
                        {attribute.description && (
                          <div className="text-sm text-muted-foreground">{attribute.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(attribute.type)}>
                        {attribute.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {attribute.type === 'select' && attribute.options ? (
                        <div className="flex flex-wrap gap-1">
                          {attribute.options.slice(0, 3).map((option, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                          {attribute.options.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{attribute.options.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {attribute.isRequired ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {attribute.isFilterable ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Products: {attribute.productAttributes?.length || 0}</div>
                        <div>Variations: {attribute.variationAttributes?.length || 0}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(attribute)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(attribute.id)}
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
    </div>
  )
}