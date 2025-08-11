import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const where: any = {}
    
    if (supplierId) {
      where.supplierId = supplierId
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
    
    const ledger = await db.supplierLedger.findMany({
      where,
      include: {
        supplier: {
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
    
    // Calculate balance for each supplier
    const supplierBalances = new Map()
    ledger.forEach(entry => {
      const currentBalance = supplierBalances.get(entry.supplierId) || 0
      supplierBalances.set(entry.supplierId, currentBalance + entry.balance)
    })
    
    // Add running balance to each entry
    const ledgerWithBalance = ledger.map(entry => ({
      ...entry,
      runningBalance: supplierBalances.get(entry.supplierId) || 0
    }))
    
    return NextResponse.json(ledgerWithBalance)
  } catch (error) {
    console.error('Error fetching supplier ledger:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier ledger' },
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
    const lastEntry = await db.supplierLedger.findFirst({
      where: { supplierId: data.supplierId },
      orderBy: { date: 'desc' }
    })
    
    const previousBalance = lastEntry ? lastEntry.balance : 0
    const newBalance = previousBalance + data.amount
    
    const ledgerEntry = await db.supplierLedger.create({
      data: {
        supplierId: data.supplierId,
        type: data.type,
        amount: data.amount,
        balance: newBalance,
        description: data.description,
        referenceId: data.referenceId,
        date: data.date ? new Date(data.date) : new Date(),
        createdBy: 'system' // TODO: Get actual user ID from auth
      },
      include: {
        supplier: {
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
    console.error('Error creating supplier ledger entry:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier ledger entry' },
      { status: 500 }
    )
  }
}