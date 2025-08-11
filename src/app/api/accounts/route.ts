import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const storeId = searchParams.get('storeId')
    
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (storeId && storeId !== 'all') {
      where.storeId = storeId
    }
    
    const accounts = await db.account.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        },
        bankAccount: true,
        transactions: {
          orderBy: {
            date: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication in API routes
    // In production, you should implement proper authentication
    
    const data = await request.json()
    
    const account = await db.account.create({
      data: {
        name: data.name,
        type: data.type,
        subtype: data.subtype,
        accountNumber: data.accountNumber,
        description: data.description,
        currency: data.currency || 'BDT',
        storeId: data.storeId,
        balance: data.balance || 0
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        },
        bankAccount: true
      }
    })
    
    return NextResponse.json(account)
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}