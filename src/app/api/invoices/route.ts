import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices - Retrieve all invoices
export async function GET() {
  try {
    const invoices = await db.sale.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected invoice format
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      totalAmount: invoice.totalAmount,
      taxAmount: invoice.taxAmount,
      discount: invoice.discount,
      paymentMethod: invoice.paymentMethod,
      customerName: invoice.customer?.name,
      customerEmail: invoice.customer?.email,
      customerPhone: invoice.customer?.phone,
      customerAddress: invoice.customer?.address,
      createdAt: invoice.createdAt.toISOString(),
      dueDate: new Date(new Date(invoice.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        name: invoice.user.name
      },
      saleItems: invoice.saleItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        product: {
          name: item.product.name,
          price: item.product.price,
          sku: item.product.sku
        }
      })),
      status: invoice.status || 'draft'
    }))

    return NextResponse.json(formattedInvoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const invoice = await db.sale.create({
      data: {
        totalAmount: body.totalAmount,
        taxAmount: body.taxAmount,
        discount: body.discount,
        paymentMethod: body.paymentMethod,
        customerId: body.customerId,
        userId: body.userId,
        status: body.status || 'draft',
        saleItems: {
          create: body.saleItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                sku: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}