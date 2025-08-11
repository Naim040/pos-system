import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding enhanced inventory data...')

  // Get all products
  const products = await prisma.product.findMany()
  if (products.length === 0) {
    console.log('No products found. Please seed products first.')
    return
  }

  // Enhanced inventory data
  const inventoryData = [
    {
      productId: products[0]?.id, // Coffee
      quantity: 25,
      minStock: 10,
      maxStock: 100,
      reorderPoint: 15,
      costPrice: 2.20,
      location: 'Warehouse A',
      aisle: 'B1',
      shelf: '3',
      bin: 'A12'
    },
    {
      productId: products[1]?.id, // Sandwich
      quantity: 8,
      minStock: 15,
      maxStock: 50,
      reorderPoint: 20,
      costPrice: 6.50,
      location: 'Kitchen',
      aisle: 'A1',
      shelf: '1',
      expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Expires in 2 days
    },
    {
      productId: products[2]?.id, // Water Bottle
      quantity: 150,
      minStock: 50,
      maxStock: 300,
      reorderPoint: 75,
      costPrice: 0.90,
      location: 'Warehouse B',
      aisle: 'C2',
      shelf: '2',
      bin: 'B05'
    },
    {
      productId: products[3]?.id, // Chips
      quantity: 5,
      minStock: 20,
      maxStock: 80,
      reorderPoint: 25,
      costPrice: 1.80,
      location: 'Warehouse A',
      aisle: 'A2',
      shelf: '4',
      bin: 'A08'
    },
    {
      productId: products[4]?.id, // Soda
      quantity: 45,
      minStock: 30,
      maxStock: 120,
      reorderPoint: 40,
      costPrice: 1.50,
      location: 'Warehouse B',
      aisle: 'C1',
      shelf: '1',
      bin: 'B02'
    },
    {
      productId: products[5]?.id, // Cookie
      quantity: 12,
      minStock: 25,
      maxStock: 75,
      reorderPoint: 30,
      costPrice: 1.20,
      location: 'Kitchen',
      aisle: 'A1',
      shelf: '2',
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // Expires in 5 days
    }
  ]

  for (const invData of inventoryData) {
    if (!invData.productId) continue

    const inventory = await prisma.inventory.upsert({
      where: { productId: invData.productId },
      update: invData,
      create: invData
    })
    console.log(`Created/updated inventory for product ID: ${invData.productId}`)
  }

  // Create some stock movements
  const stockMovements = [
    {
      productId: products[0]?.id,
      type: 'in',
      quantity: 10,
      reason: 'purchase',
      notes: 'Restocked from supplier'
    },
    {
      productId: products[1]?.id,
      type: 'out',
      quantity: 5,
      reason: 'sale',
      notes: 'Customer purchase'
    },
    {
      productId: products[2]?.id,
      type: 'in',
      quantity: 50,
      reason: 'purchase',
      notes: 'Bulk purchase order'
    },
    {
      productId: products[3]?.id,
      type: 'out',
      quantity: 3,
      reason: 'damage',
      notes: 'Damaged during handling'
    },
    {
      productId: products[4]?.id,
      type: 'in',
      quantity: 25,
      reason: 'return',
      notes: 'Customer return'
    }
  ]

  for (const movementData of stockMovements) {
    if (!movementData.productId) continue

    // Get inventory ID
    const inventory = await prisma.inventory.findUnique({
      where: { productId: movementData.productId }
    })

    if (inventory) {
      const movement = await prisma.stockMovement.create({
        data: {
          productId: movementData.productId,
          inventoryId: inventory.id,
          type: movementData.type,
          quantity: movementData.quantity,
          reason: movementData.reason,
          notes: movementData.notes
        }
      })
      console.log(`Created stock movement: ${movement.id}`)
    }
  }

  console.log('Enhanced inventory data seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })