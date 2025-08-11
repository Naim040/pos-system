import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const where: any = {}
    
    if (storeId && storeId !== 'all') {
      where.storeId = storeId
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (status) {
      where.status = status
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    const expenses = await db.expense.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        expenseItems: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication in API routes
    // In production, you should implement proper authentication
    
    const data = await request.json()
    
    const expense = await db.expense.create({
      data: {
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        paymentMethod: data.paymentMethod,
        status: data.status || 'pending',
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        storeId: data.storeId,
        createdBy: 'system', // TODO: Get actual user ID from auth
        expenseItems: {
          create: data.expenseItems?.map((item: any) => ({
            description: item.description,
            amount: item.amount,
            quantity: item.quantity || 1
          })) || []
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        expenseItems: true
      }
    })
    
    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}