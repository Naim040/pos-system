import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('type') || 'summary'

    // Build where clause
    const where: any = {}
    
    if (storeId && storeId !== 'all') {
      where.storeId = storeId
    }
    
    if (startDate && endDate) {
      where.returnDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (reportType === 'summary') {
      // Generate summary report
      const [returns, totalReturns, totalAmount, refundsByType, returnsByReason, returnsByStatus] = await Promise.all([
        // Get returns with basic info
        db.productReturn.findMany({
          where,
          include: {
            customer: {
              select: { id: true, name: true, email: true }
            },
            store: {
              select: { id: true, name: true, code: true }
            },
            user: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: { returnItems: true }
            }
          },
          orderBy: { returnDate: 'desc' }
        }),
        
        // Total returns count
        db.productReturn.count({ where }),
        
        // Total refund amount
        db.productReturn.aggregate({
          where,
          _sum: { refundAmount: true }
        }),
        
        // Refunds by type
        db.productReturn.groupBy({
          by: ['refundType'],
          where,
          _sum: { refundAmount: true },
          _count: true
        }),
        
        // Returns by reason (from return items)
        db.returnItem.groupBy({
          by: ['returnReason'],
          where: {
            returnProduct: {
              ...where
            }
          },
          _sum: { quantity: true },
          _count: true
        }),
        
        // Returns by status
        db.productReturn.groupBy({
          by: ['status'],
          where,
          _count: true,
          _sum: { refundAmount: true }
        })
      ])

      // Calculate additional metrics
      const returnsByDay = await db.productReturn.groupBy({
        by: ['returnDate'],
        where,
        _count: true,
        _sum: { refundAmount: true },
        orderBy: { returnDate: 'asc' }
      })

      // Top returned products
      const topReturnedProducts = await db.returnItem.groupBy({
        by: ['productId'],
        where: {
          returnProduct: {
            ...where
          }
        },
        _sum: { quantity: true },
        _count: true,
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      })

      // Get product details for top returned products
      const topProductsWithDetails = await Promise.all(
        topReturnedProducts.map(async (item) => {
          const product = await db.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, sku: true, barcode: true }
          })
          return {
            ...item,
            product
          }
        })
      )

      return NextResponse.json({
        type: 'summary',
        data: {
          summary: {
            totalReturns,
            totalRefundAmount: totalReturns._sum.refundAmount || 0,
            averageRefundAmount: totalReturns > 0 ? (totalReturns._sum.refundAmount || 0) / totalReturns : 0
          },
          refundsByType,
          returnsByReason,
          returnsByStatus,
          returnsByDay,
          topReturnedProducts: topProductsWithDetails,
          returns
        }
      })

    } else if (reportType === 'detailed') {
      // Generate detailed report
      const returns = await db.productReturn.findMany({
        where,
        include: {
          sale: {
            include: {
              customer: true,
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          customer: true,
          store: {
            select: { id: true, name: true, code: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          },
          returnItems: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true }
              },
              variation: {
                select: { id: true, sku: true }
              }
            }
          },
          returnRefunds: true
        },
        orderBy: { returnDate: 'desc' }
      })

      return NextResponse.json({
        type: 'detailed',
        data: {
          returns,
          totalReturns: returns.length,
          totalRefundAmount: returns.reduce((sum, ret) => sum + ret.refundAmount, 0)
        }
      })

    } else if (reportType === 'analytics') {
      // Generate analytics report
      const [
        returnsByMonth,
        refundsByMethod,
        returnTrends,
        customerReturnStats
      ] = await Promise.all([
        // Returns by month
        db.productReturn.groupBy({
          by: ['returnDate'],
          where,
          _count: true,
          _sum: { refundAmount: true },
          orderBy: { returnDate: 'asc' }
        }),

        // Refunds by method
        db.productReturn.groupBy({
          by: ['refundType'],
          where,
          _count: true,
          _sum: { refundAmount: true }
        }),

        // Return trends (last 30 days)
        db.productReturn.findMany({
          where: {
            ...where,
            returnDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          select: {
            returnDate: true,
            refundAmount: true,
            status: true
          },
          orderBy: { returnDate: 'asc' }
        }),

        // Customer return statistics
        db.productReturn.groupBy({
          by: ['customerId'],
          where: {
            ...where,
            customerId: { not: null }
          },
          _count: true,
          _sum: { refundAmount: true },
          orderBy: {
            _count: {
              customerId: 'desc'
            }
          },
          take: 10
        })
      ])

      // Get customer details for top returning customers
      const topCustomersWithDetails = await Promise.all(
        customerReturnStats.map(async (stat) => {
          if (!stat.customerId) return null
          
          const customer = await db.customer.findUnique({
            where: { id: stat.customerId },
            select: { id: true, name: true, email: true, phone: true }
          })
          
          return {
            ...stat,
            customer
          }
        })
      )

      return NextResponse.json({
        type: 'analytics',
        data: {
          returnsByMonth,
          refundsByMethod,
          returnTrends,
          topReturningCustomers: topCustomersWithDetails.filter(Boolean)
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid report type' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error generating return reports:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate return reports',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}