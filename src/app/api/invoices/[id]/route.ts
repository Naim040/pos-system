import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

// GET /api/invoices/[id] - Retrieve single invoice
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const invoice = await db.sale.findUnique({
      where: { id: params.id },
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

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const formattedInvoice = {
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
    }

    return NextResponse.json(formattedInvoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()
    
    const invoice = await db.sale.update({
      where: { id: params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
        ...(body.discount !== undefined && { discount: body.discount }),
        updatedAt: new Date()
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
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // First delete sale items
    await db.saleItem.deleteMany({
      where: { saleId: params.id }
    })

    // Then delete the sale/invoice
    await db.sale.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}