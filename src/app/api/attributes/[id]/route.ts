import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

interface RouteParams {
  params: { id: string }
}

// Get single attribute
export const GET = withLicenseProtection(async (request: NextRequest, context: RouteParams) => {
  try {
    const { id } = context.params

    const attribute = await db.attribute.findUnique({
      where: { id },
      include: {
        productAttributes: {
          include: {
            product: {
              select: { id: true, name: true }
            }
          }
        },
        variationAttributes: {
          include: {
            variation: {
              include: {
                product: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    })

    if (!attribute) {
      return NextResponse.json(
        { error: 'Attribute not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ attribute })
  } catch (error) {
    console.error('Get attribute error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attribute' },
      { status: 500 }
    )
  }
})

// Update attribute
export const PUT = withLicenseProtection(async (request: NextRequest, context: RouteParams) => {
  try {
    const { id } = context.params
    const data = await request.json()
    const { name, type, description, isRequired, isFilterable, options, isActive } = data

    const attribute = await db.attribute.findUnique({
      where: { id }
    })

    if (!attribute) {
      return NextResponse.json(
        { error: 'Attribute not found' },
        { status: 404 }
      )
    }

    // Check if name is being changed and already exists
    if (name && name !== attribute.name) {
      const existingAttribute = await db.attribute.findUnique({
        where: { name }
      })

      if (existingAttribute) {
        return NextResponse.json(
          { error: 'Attribute with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (description !== undefined) updateData.description = description
    if (isRequired !== undefined) updateData.isRequired = isRequired
    if (isFilterable !== undefined) updateData.isFilterable = isFilterable
    if (isActive !== undefined) updateData.isActive = isActive
    if (options !== undefined) {
      updateData.options = type === 'select' ? JSON.stringify(options) : null
    }

    const updatedAttribute = await db.attribute.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      message: 'Attribute updated successfully',
      attribute: updatedAttribute
    })
  } catch (error) {
    console.error('Update attribute error:', error)
    return NextResponse.json(
      { error: 'Failed to update attribute' },
      { status: 500 }
    )
  }
})

// Delete attribute (soft delete by setting isActive to false)
export const DELETE = withLicenseProtection(async (request: NextRequest, context: RouteParams) => {
  try {
    const { id } = context.params

    const attribute = await db.attribute.findUnique({
      where: { id }
    })

    if (!attribute) {
      return NextResponse.json(
        { error: 'Attribute not found' },
        { status: 404 }
      )
    }

    await db.attribute.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      message: 'Attribute deleted successfully'
    })
  } catch (error) {
    console.error('Delete attribute error:', error)
    return NextResponse.json(
      { error: 'Failed to delete attribute' },
      { status: 500 }
    )
  }
})