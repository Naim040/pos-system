import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const where: any = {}
    
    if (storeId && storeId !== 'all') {
      where.storeId = storeId
    }
    
    if (type) {
      where.type = type
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    const transactions = await db.cashTransaction.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    // Calculate running balance
    let runningBalance = 0
    const transactionsWithBalance = transactions.map(transaction => {
      if (transaction.type === 'income') {
        runningBalance += transaction.amount
      } else {
        runningBalance -= transaction.amount
      }
      return {
        ...transaction,
        runningBalance
      }
    })
    
    return NextResponse.json(transactionsWithBalance)
  } catch (error) {
    console.error('Error fetching cash transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cash transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication in API routes
    // In production, you should implement proper authentication
    
    const data = await request.json()
    
    // Get the last cash balance
    const lastTransaction = await db.cashTransaction.findFirst({
      where: {
        storeId: data.storeId
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    const previousBalance = lastTransaction ? lastTransaction.balance : 0
    let newBalance = previousBalance
    
    if (data.type === 'income') {
      newBalance += data.amount
    } else {
      newBalance -= data.amount
    }
    
    const transaction = await db.cashTransaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        date: data.date ? new Date(data.date) : new Date(),
        balance: newBalance,
        storeId: data.storeId,
        createdBy: 'system' // TODO: Get actual user ID from auth
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error creating cash transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create cash transaction' },
      { status: 500 }
    )
  }
}