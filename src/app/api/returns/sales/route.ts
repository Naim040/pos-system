import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const storeId = searchParams.get('storeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const customer = searchParams.get('customer')

    const skip = (page - 1) * limit

    // Build where clause for sales that can be returned
    const where: any = {
      status: 'completed', // Only completed sales can be returned
      // Exclude sales that are fully returned or too old
      createdAt: {
        gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last 365 days (increased from 90)
      }
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (storeId) {
      where.storeId = storeId
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Add search conditions
    if (search || customer) {
      where.OR = []
      
      if (search) {
        where.OR.push(
          { id: { contains: search } }
        )
        
        // Only add customer fields if search looks like a name/email
        if (!search.startsWith('cmd')) {
          where.OR.push(
            { customerName: { contains: search, mode: 'insensitive' } },
            { customerEmail: { contains: search, mode: 'insensitive' } }
          )
        }
      }
      
      if (customer) {
        where.OR.push(
          { customerName: { contains: customer, mode: 'insensitive' } },
          { customerEmail: { contains: customer, mode: 'insensitive' } }
        )
      }
    }

    // Get sales with related data
    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true }
          },
          store: {
            select: { id: true, name: true, code: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          },
          saleItems: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true, imageUrl: true }
              },
              variation: {
                select: { id: true, sku: true }
              },
              returnItems: {
                select: {
                  id: true,
                  quantity: true
                }
              }
            }
          },
          payments: {
            select: { id: true, amount: true, method: true, transactionId: true }
          },
          productReturns: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              refundAmount: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.sale.count({ where })
    ])

    // Calculate returnable amounts for each sale
    const salesWithReturnInfo = sales.map(sale => {
      const totalReturns = sale.productReturns.reduce((sum, ret) => sum + ret.totalAmount, 0)
      const returnableAmount = Math.max(0, sale.totalAmount - totalReturns)
      
      // Calculate returnable items
      const returnableItems = sale.saleItems.map(item => {
        const returnedQuantity = item.returnItems.reduce((sum, retItem) => sum + retItem.quantity, 0)
        const returnableQuantity = Math.max(0, item.quantity - returnedQuantity)
        
        return {
          ...item,
          returnedQuantity,
          returnableQuantity,
          returnableAmount: returnableQuantity * item.unitPrice
        }
      }).filter(item => item.returnableQuantity > 0)

      return {
        ...sale,
        totalReturns,
        returnableAmount,
        returnableItems,
        hasReturnableItems: returnableItems.length > 0,
        returnStatus: totalReturns >= sale.totalAmount ? 'fully_returned' : 
                       totalReturns > 0 ? 'partially_returned' : 'not_returned'
      }
    })

    // Apply additional filtering for customer search (since we can't do it in Prisma query)
    let filteredSales = salesWithReturnInfo
    if (customer) {
      const customerLower = customer.toLowerCase()
      filteredSales = salesWithReturnInfo.filter(sale => 
        sale.customer?.name?.toLowerCase().includes(customerLower) ||
        sale.customer?.email?.toLowerCase().includes(customerLower)
      )
    }

    return NextResponse.json({
      sales: filteredSales,
      pagination: {
        page,
        limit,
        total: filteredSales.length,
        pages: Math.ceil(filteredSales.length / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching sales for returns:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch sales for returns',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}