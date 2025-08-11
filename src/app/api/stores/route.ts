import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const stores = await db.store.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            users: true,
            inventory: true,
            sales: true,
            purchaseOrders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(stores)
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      code,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      timezone,
      currency,
      isActive,
      isHeadquarters,
      openingHours,
      notes,
      managerId
    } = body

    // Check if store code already exists
    const existingStore = await db.store.findUnique({
      where: { code }
    })

    if (existingStore) {
      return NextResponse.json(
        { error: 'Store code already exists' },
        { status: 400 }
      )
    }

    // If this is set as headquarters, remove headquarters flag from other stores
    if (isHeadquarters) {
      await db.store.updateMany({
        where: { isHeadquarters: true },
        data: { isHeadquarters: false }
      })
    }

    const store = await db.store.create({
      data: {
        name,
        code,
        address,
        city,
        state,
        zipCode,
        country,
        phone,
        email,
        timezone,
        currency,
        isActive,
        isHeadquarters,
        openingHours,
        notes,
        managerId
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error creating store:', error)
    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    )
  }
}