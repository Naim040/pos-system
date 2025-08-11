import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding purchase orders...')

  // Get suppliers
  const suppliers = await prisma.supplier.findMany()
  if (suppliers.length === 0) {
    console.log('No suppliers found. Please seed suppliers first.')
    return
  }

  // Get products
  const products = await prisma.product.findMany()
  if (products.length === 0) {
    console.log('No products found. Please seed products first.')
    return
  }

  const purchaseOrders = [
    {
      supplierId: suppliers[0].id,
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Monthly restocking order',
      items: [
        { productId: products[0]?.id, quantity: 50, unitPrice: 2.50 },
        { productId: products[1]?.id, quantity: 30, unitPrice: 7.50 },
        { productId: products[4]?.id, quantity: 100, unitPrice: 1.80 }
      ]
    },
    {
      supplierId: suppliers[1].id,
      expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      notes: 'Urgent beverage order',
      status: 'confirmed',
      items: [
        { productId: products[2]?.id, quantity: 200, unitPrice: 1.20 },
        { productId: products[4]?.id, quantity: 150, unitPrice: 2.00 }
      ]
    },
    {
      supplierId: suppliers[2].id,
      expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: 'Snack inventory replenishment',
      status: 'sent',
      items: [
        { productId: products[3]?.id, quantity: 75, unitPrice: 2.25 },
        { productId: products[5]?.id, quantity: 60, unitPrice: 1.80 }
      ]
    }
  ]

  for (const poData of purchaseOrders) {
    // Calculate totals
    let subtotal = 0
    const processedItems = poData.items.map(item => {
      const totalPrice = item.quantity * item.unitPrice
      subtotal += totalPrice
      return {
        ...item,
        totalPrice,
        receivedQuantity: Math.floor(Math.random() * item.quantity) // Random received quantity for demo
      }
    })

    const tax = subtotal * 0.08
    const shipping = 15.00
    const total = subtotal + tax + shipping

    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId: poData.supplierId,
        orderNumber,
        status: poData.status || 'draft',
        expectedDate: poData.expectedDate,
        subtotal,
        tax,
        shipping,
        total,
        notes: poData.notes,
        createdBy: 'system',
        items: {
          create: processedItems
        }
      }
    })

    console.log(`Created purchase order: ${orderNumber}`)
  }

  console.log('Purchase orders seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })