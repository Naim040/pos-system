import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null && isActive !== 'all') {
      where.isActive = isActive === 'true'
    }

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          purchaseOrders: {
            select: {
              id: true,
              status: true,
              total: true,
              orderDate: true
            }
          }
        }
      }),
      db.supplier.count({ where })
    ])

    return NextResponse.json({
      suppliers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      website,
      taxId,
      paymentTerms,
      notes
    } = body

    // Check if supplier with same email already exists
    if (email) {
      const existingSupplier = await db.supplier.findUnique({
        where: { email }
      })

      if (existingSupplier) {
        return NextResponse.json(
          { error: 'Supplier with this email already exists' },
          { status: 400 }
        )
      }
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        website,
        taxId,
        paymentTerms,
        notes
      },
      include: {
        purchaseOrders: {
          select: {
            id: true,
            status: true,
            total: true,
            orderDate: true
          }
        }
      }
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}