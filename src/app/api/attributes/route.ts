import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

// Get all attributes
export const GET = withLicenseProtection(async () => {
  try {
    const attributes = await db.attribute.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ attributes })
  } catch (error) {
    console.error('Get attributes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attributes' },
      { status: 500 }
    )
  }
})

// Create new attribute
export const POST = withLicenseProtection(async (request: NextRequest) => {
  try {
    const data = await request.json()
    const { name, type, description, isRequired, isFilterable, options } = data

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Validate attribute type
    const validTypes = ['text', 'number', 'select', 'boolean', 'date']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid attribute type' },
        { status: 400 }
      )
    }

    // For select type, options are required
    if (type === 'select' && (!options || !Array.isArray(options) || options.length === 0)) {
      return NextResponse.json(
        { error: 'Options are required for select type' },
        { status: 400 }
      )
    }

    // Check if attribute name already exists
    const existingAttribute = await db.attribute.findUnique({
      where: { name }
    })

    if (existingAttribute) {
      return NextResponse.json(
        { error: 'Attribute with this name already exists' },
        { status: 409 }
      )
    }

    const attribute = await db.attribute.create({
      data: {
        name,
        type,
        description: description || null,
        isRequired: isRequired || false,
        isFilterable: isFilterable !== false,
        options: type === 'select' ? JSON.stringify(options) : null
      }
    })

    return NextResponse.json({
      message: 'Attribute created successfully',
      attribute
    })
  } catch (error) {
    console.error('Create attribute error:', error)
    return NextResponse.json(
      { error: 'Failed to create attribute' },
      { status: 500 }
    )
  }
})