import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the e-commerce order
    const ecommerceOrder = await db.ecommerceOrder.findUnique({
      where: { id: params.id },
      include: {
        store: true
      }
    })

    if (!ecommerceOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order is already imported
    if (ecommerceOrder.saleId) {
      return NextResponse.json(
        { error: 'Order already imported' },
        { status: 400 }
      )
    }

    // Parse order data
    const shippingAddress = JSON.parse(ecommerceOrder.shippingAddress)
    const billingAddress = JSON.parse(ecommerceOrder.billingAddress)
    const items = JSON.parse(ecommerceOrder.items)

    // Find or create customer
    let customer = await db.customer.findFirst({
      where: {
        OR: [
          { email: ecommerceOrder.customerEmail },
          { phone: ecommerceOrder.customerPhone }
        ]
      }
    })

    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: ecommerceOrder.customerName,
          email: ecommerceOrder.customerEmail,
          phone: ecommerceOrder.customerPhone,
          address: `${shippingAddress.address1}, ${shippingAddress.city}`,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zip,
          country: shippingAddress.country
        }
      })
    }

    // Create POS sale
    const sale = await db.sale.create({
      data: {
        userId: 'system', // This should be the current user ID
        customerId: customer.id,
        storeId: ecommerceOrder.storeId,
        totalAmount: ecommerceOrder.total,
        taxAmount: ecommerceOrder.tax,
        discount: ecommerceOrder.discount,
        status: 'completed',
        paymentMethod: ecommerceOrder.paymentMethod || 'card',
        customerName: ecommerceOrder.customerName,
        customerEmail: ecommerceOrder.customerEmail
      }
    })

    // Create sale items
    for (const item of items) {
      // Find the product by SKU or name
      const product = await db.product.findFirst({
        where: {
          OR: [
            { sku: item.sku },
            { name: { contains: item.name } }
          ]
        }
      })

      if (product) {
        await db.saleItem.create({
          data: {
            saleId: sale.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.total
          }
        })

        // Update inventory
        const inventory = await db.inventory.findFirst({
          where: {
            productId: product.id,
            storeId: ecommerceOrder.storeId
          }
        })

        if (inventory) {
          await db.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          })
        }
      }
    }

    // Create payment record
    await db.payment.create({
      data: {
        saleId: sale.id,
        amount: ecommerceOrder.total,
        method: ecommerceOrder.paymentMethod || 'card'
      }
    })

    // Update e-commerce order with sale reference
    await db.ecommerceOrder.update({
      where: { id: params.id },
      data: {
        saleId: sale.id,
        status: 'processing' // Update status to processing since it's now being handled
      }
    })

    return NextResponse.json({
      success: true,
      saleId: sale.id,
      message: 'Order successfully imported into POS'
    })
  } catch (error) {
    console.error('Error importing e-commerce order:', error)
    return NextResponse.json(
      { error: 'Failed to import order' },
      { status: 500 }
    )
  }
}