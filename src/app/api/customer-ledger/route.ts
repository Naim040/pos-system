import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const where: any = {}
    
    if (customerId) {
      where.customerId = customerId
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
    
    const ledger = await db.customerLedger.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    // Calculate balance for each customer
    const customerBalances = new Map()
    ledger.forEach(entry => {
      const currentBalance = customerBalances.get(entry.customerId) || 0
      customerBalances.set(entry.customerId, currentBalance + entry.balance)
    })
    
    // Add running balance to each entry
    const ledgerWithBalance = ledger.map(entry => ({
      ...entry,
      runningBalance: customerBalances.get(entry.customerId) || 0
    }))
    
    return NextResponse.json(ledgerWithBalance)
  } catch (error) {
    console.error('Error fetching customer ledger:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer ledger' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication in API routes
    // In production, you should implement proper authentication
    
    const data = await request.json()
    
    // Calculate new balance
    const lastEntry = await db.customerLedger.findFirst({
      where: { customerId: data.customerId },
      orderBy: { date: 'desc' }
    })
    
    const previousBalance = lastEntry ? lastEntry.balance : 0
    const newBalance = previousBalance + data.amount
    
    const ledgerEntry = await db.customerLedger.create({
      data: {
        customerId: data.customerId,
        type: data.type,
        amount: data.amount,
        balance: newBalance,
        description: data.description,
        referenceId: data.referenceId,
        date: data.date ? new Date(data.date) : new Date(),
        createdBy: 'system' // TODO: Get actual user ID from auth
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })
    
    return NextResponse.json(ledgerEntry)
  } catch (error) {
    console.error('Error creating customer ledger entry:', error)
    return NextResponse.json(
      { error: 'Failed to create customer ledger entry' },
      { status: 500 }
    )
  }
}