import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const isActive = searchParams.get('isActive')
    
    const where: any = {}
    
    if (storeId && storeId !== 'all') {
      where.storeId = storeId
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    
    const bankAccounts = await db.bankAccount.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            balance: true,
            currency: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        bankTransactions: {
          orderBy: {
            transactionDate: 'desc'
          },
          take: 10
        }
      },
      orderBy: {
        bankName: 'asc'
      }
    })
    
    return NextResponse.json(bankAccounts)
  } catch (error) {
    console.error('Error fetching bank accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication in API routes
    // In production, you should implement proper authentication
    
    const data = await request.json()
    
    // Create the main account first
    const account = await db.account.create({
      data: {
        name: `${data.bankName} - ${data.accountNumber}`,
        type: 'asset',
        subtype: 'bank',
        accountNumber: data.accountNumber,
        description: `Bank account at ${data.bankName}`,
        currency: data.currency || 'BDT',
        storeId: data.storeId,
        balance: data.balance || 0
      }
    })
    
    // Then create the bank account
    const bankAccount = await db.bankAccount.create({
      data: {
        accountId: account.id,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        branchName: data.branchName,
        routingNumber: data.routingNumber,
        swiftCode: data.swiftCode,
        iban: data.iban,
        balance: data.balance || 0,
        currency: data.currency || 'BDT',
        storeId: data.storeId
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            balance: true,
            currency: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    return NextResponse.json(bankAccount)
  } catch (error) {
    console.error('Error creating bank account:', error)
    return NextResponse.json(
      { error: 'Failed to create bank account' },
      { status: 500 }
    )
  }
}