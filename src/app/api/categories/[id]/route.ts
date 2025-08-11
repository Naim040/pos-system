import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.ts'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true
          }
        },
        parent: true,
        children: {
          include: {
            _count: {
              select: {
                products: true
              }
            }
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const formattedCategory = {
      id: category.id,
      name: category.name,
      description: category.description,
      code: category.code,
      level: category.level,
      hsCode: category.hsCode,
      googleTaxonomyId: category.googleTaxonomyId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      productCount: category._count.products,
      parent: category.parent,
      children: category.children,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    }

    return NextResponse.json(formattedCategory)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { 
      name, 
      description, 
      code, 
      parentId, 
      level, 
      hsCode, 
      googleTaxonomyId, 
      isActive, 
      sortOrder 
    } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check for duplicate category name within the same parent (excluding current category)
    const duplicateCategory = await db.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        parentId: parentId || null,
        NOT: {
          id: params.id
        }
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists in this level' },
        { status: 400 }
      )
    }

    // Validate parent category if provided
    if (parentId) {
      const parentCategory = await db.category.findUnique({
        where: { id: parentId }
      })
      
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }

      // Prevent circular reference
      if (parentId === params.id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      code: code?.trim() || null,
      parentId: parentId,
      hsCode: hsCode?.trim() || null,
      googleTaxonomyId: googleTaxonomyId?.trim() || null,
      isActive: isActive !== undefined ? isActive : existingCategory.isActive,
      sortOrder: sortOrder !== undefined ? sortOrder : existingCategory.sortOrder
    }

    // Update level based on parent
    if (parentId) {
      const parentCategory = await db.category.findUnique({
        where: { id: parentId }
      })
      if (parentCategory) {
        updateData.level = parentCategory.level + 1
      }
    } else {
      updateData.level = 1
    }

    const category = await db.category.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            products: true
          }
        },
        parent: true,
        children: {
          include: {
            _count: {
              select: {
                products: true
              }
            }
          }
        }
      }
    })

    const formattedCategory = {
      id: category.id,
      name: category.name,
      description: category.description,
      code: category.code,
      level: category.level,
      hsCode: category.hsCode,
      googleTaxonomyId: category.googleTaxonomyId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      productCount: category._count.products,
      parent: category.parent,
      children: category.children,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    }

    return NextResponse.json(formattedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if category exists and get product count
    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true
          }
        },
        children: true
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated products' },
        { status: 400 }
      )
    }

    // Prevent deletion if category has children
    if (category.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories' },
        { status: 400 }
      )
    }

    await db.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}