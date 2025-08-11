import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    
    const where: any = {}
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    
    const categories = await db.expenseCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            expenses: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching expense categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication in API routes
    // In production, you should implement proper authentication
    
    const data = await request.json()
    
    const category = await db.expenseCategory.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true
      }
    })
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating expense category:', error)
    return NextResponse.json(
      { error: 'Failed to create expense category' },
      { status: 500 }
    )
  }
}