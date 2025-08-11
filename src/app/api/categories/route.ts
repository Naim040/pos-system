import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.ts'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.category.findMany({
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
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Build hierarchical structure
    const buildHierarchy = (categories: any[], parentId: string | null = null): any[] => {
      return categories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          code: cat.code,
          level: cat.level,
          hsCode: cat.hsCode,
          googleTaxonomyId: cat.googleTaxonomyId,
          isActive: cat.isActive,
          sortOrder: cat.sortOrder,
          productCount: cat._count.products,
          parent: cat.parent,
          children: buildHierarchy(categories, cat.id),
          createdAt: cat.createdAt.toISOString(),
          updatedAt: cat.updatedAt.toISOString()
        }))
    }

    const hierarchicalCategories = buildHierarchy(categories)

    return NextResponse.json(hierarchicalCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      level = 1, 
      hsCode, 
      googleTaxonomyId, 
      isActive = true, 
      sortOrder = 0 
    } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate category name within the same parent
    const existingCategory = await db.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        parentId: parentId || null
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists in this level' },
        { status: 400 }
      )
    }

    // If parentId is provided, validate it exists and set level
    let parentCategory = null
    if (parentId) {
      parentCategory = await db.category.findUnique({
        where: { id: parentId }
      })
      
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }
    }

    const categoryData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      code: code?.trim() || null,
      level: parentCategory ? parentCategory.level + 1 : level,
      parentId: parentId,
      hsCode: hsCode?.trim() || null,
      googleTaxonomyId: googleTaxonomyId?.trim() || null,
      isActive: isActive,
      sortOrder: sortOrder
    }

    const category = await db.category.create({
      data: categoryData,
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

    return NextResponse.json(formattedCategory, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}