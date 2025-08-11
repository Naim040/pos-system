import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// For now, we'll use in-memory storage since LicenseTemplate model doesn't exist in schema
// In a real implementation, you would add the LicenseTemplate model to your Prisma schema
const licenseTemplates: any[] = [
  {
    id: '1',
    name: 'Basic POS',
    description: 'Essential POS functionality for small businesses',
    type: 'lifetime',
    maxUsers: 1,
    maxStores: 1,
    maxActivations: 2,
    duration: 0,
    price: 299,
    features: ['POS', 'Basic Inventory', 'Sales Reports', 'Customer Management'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Professional POS',
    description: 'Advanced POS with inventory management and analytics',
    type: 'yearly',
    maxUsers: 5,
    maxStores: 3,
    maxActivations: 5,
    duration: 12,
    price: 999,
    features: ['POS', 'Advanced Inventory', 'Analytics', 'Multi-store', 'Employee Management', 'Advanced Reports'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Enterprise POS',
    description: 'Complete enterprise solution with franchise support',
    type: 'yearly',
    maxUsers: 50,
    maxStores: 20,
    maxActivations: 10,
    duration: 12,
    price: 4999,
    features: ['POS', 'Enterprise Inventory', 'Advanced Analytics', 'Multi-store', 'Franchise Management', 'Advanced Reporting', 'API Access', 'Priority Support'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Trial Version',
    description: '30-day trial with full functionality',
    type: 'trial',
    maxUsers: 2,
    maxStores: 1,
    maxActivations: 1,
    duration: 1,
    price: 0,
    features: ['POS', 'Inventory', 'Reports', 'Analytics'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'list' || !action) {
      // Return all active templates
      const activeTemplates = licenseTemplates.filter(t => t.isActive)
      return NextResponse.json({ templates: activeTemplates })
    }

    if (action === 'get') {
      const templateId = searchParams.get('id')
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        )
      }

      const template = licenseTemplates.find(t => t.id === templateId)
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ template })
    }

    if (action === 'stats') {
      const stats = {
        totalTemplates: licenseTemplates.length,
        activeTemplates: licenseTemplates.filter(t => t.isActive).length,
        typeDistribution: licenseTemplates.reduce((acc, template) => {
          acc[template.type] = (acc[template.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        priceRange: {
          min: Math.min(...licenseTemplates.map(t => t.price)),
          max: Math.max(...licenseTemplates.map(t => t.price)),
          average: licenseTemplates.reduce((sum, t) => sum + t.price, 0) / licenseTemplates.length
        }
      }

      return NextResponse.json({ stats })
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )

  } catch (error) {
    console.error('License templates error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get license templates',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create') {
      const { name, description, type, maxUsers, maxStores, maxActivations, duration, price, features, isActive = true } = data
      
      if (!name || !description || !type) {
        return NextResponse.json(
          { error: 'Name, description, and type are required' },
          { status: 400 }
        )
      }

      // Validate template data
      if (maxUsers < 1 || maxStores < 1 || maxActivations < 1) {
        return NextResponse.json(
          { error: 'Max users, stores, and activations must be at least 1' },
          { status: 400 }
        )
      }

      if (price < 0) {
        return NextResponse.json(
          { error: 'Price cannot be negative' },
          { status: 400 }
        )
      }

      // Create new template
      const newTemplate = {
        id: Date.now().toString(),
        name,
        description,
        type,
        maxUsers,
        maxStores,
        maxActivations,
        duration,
        price,
        features: features || [],
        isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      licenseTemplates.push(newTemplate)

      return NextResponse.json({ 
        template: newTemplate,
        message: 'Template created successfully'
      })

    } else if (action === 'update') {
      const { templateId, ...updateData } = data
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        )
      }

      const templateIndex = licenseTemplates.findIndex(t => t.id === templateId)
      
      if (templateIndex === -1) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      // Update template
      const updatedTemplate = {
        ...licenseTemplates[templateIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      }

      licenseTemplates[templateIndex] = updatedTemplate

      return NextResponse.json({ 
        template: updatedTemplate,
        message: 'Template updated successfully'
      })

    } else if (action === 'delete') {
      const { templateId } = data
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        )
      }

      const templateIndex = licenseTemplates.findIndex(t => t.id === templateId)
      
      if (templateIndex === -1) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      // Remove template
      licenseTemplates.splice(templateIndex, 1)

      return NextResponse.json({ 
        message: 'Template deleted successfully'
      })

    } else if (action === 'generate-from-template') {
      const { templateId, count = 1, clientName, clientEmail } = data
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        )
      }

      if (count < 1 || count > 50) {
        return NextResponse.json(
          { error: 'Count must be between 1 and 50' },
          { status: 400 }
        )
      }

      const template = licenseTemplates.find(t => t.id === templateId)
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      // Generate licenses from template
      const licenses = []
      
      for (let i = 0; i < count; i++) {
        const licenseData = {
          type: template.type,
          clientName: clientName || `${template.name} License ${i + 1}`,
          clientEmail: clientEmail || `generated${i + 1}@${template.name.toLowerCase().replace(/\s+/g, '')}.com`,
          maxUsers: template.maxUsers,
          maxStores: template.maxStores,
          maxActivations: template.maxActivations,
          notes: `Generated from template: ${template.name}`
        }

        // Call the enhanced license API to create the license
        const licenseResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/licenses/enhanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create',
            ...licenseData
          }),
        })

        if (licenseResponse.ok) {
          const licenseResult = await licenseResponse.json()
          licenses.push(licenseResult.license)
        }
      }

      return NextResponse.json({ 
        licenses,
        count: licenses.length,
        template: template.name,
        message: `Generated ${licenses.length} licenses from template`
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('License templates management error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process template request',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, ...updateData } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const templateIndex = licenseTemplates.findIndex(t => t.id === templateId)
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Update template
    const updatedTemplate = {
      ...licenseTemplates[templateIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    licenseTemplates[templateIndex] = updatedTemplate

    return NextResponse.json({ 
      template: updatedTemplate,
      message: 'Template updated successfully'
    })

  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update template',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const templateIndex = licenseTemplates.findIndex(t => t.id === templateId)
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Remove template
    licenseTemplates.splice(templateIndex, 1)

    return NextResponse.json({ 
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Template deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete template',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}