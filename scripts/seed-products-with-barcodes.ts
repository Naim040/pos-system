import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding products with barcodes...')

  const productsWithBarcodes = [
    {
      name: 'Coca Cola 12oz',
      description: 'Refreshing cola drink',
      price: 1.99,
      sku: 'COCA-001',
      barcode: '049000050103'
    },
    {
      name: 'Pepsi 12oz',
      description: 'Classic cola drink',
      price: 1.99,
      sku: 'PEPS-001',
      barcode: '012000009654'
    },
    {
      name: 'Spring Water 16oz',
      description: 'Pure spring water',
      price: 1.29,
      sku: 'WATER-001',
      barcode: '078000056210'
    },
    {
      name: 'Potato Chips 1oz',
      description: 'Crunchy potato chips',
      price: 1.49,
      sku: 'CHIPS-001',
      barcode: '028400078705'
    },
    {
      name: 'Chocolate Bar 1.5oz',
      description: 'Milk chocolate bar',
      price: 1.79,
      sku: 'CHOC-001',
      barcode: '040000527810'
    },
    {
      name: 'Energy Drink 8oz',
      description: 'Citrus energy drink',
      price: 2.99,
      sku: 'ENERGY-001',
      barcode: '089000045678'
    },
    {
      name: 'Sandwich Turkey',
      description: 'Turkey and cheese sandwich',
      price: 4.99,
      sku: 'SAND-001',
      barcode: '075678901234'
    },
    {
      name: 'Coffee Small',
      description: 'Fresh brewed coffee',
      price: 2.49,
      sku: 'COFFEE-001',
      barcode: '098765432101'
    },
    {
      name: 'Donut Glazed',
      description: 'Fresh glazed donut',
      price: 1.29,
      sku: 'DONUT-001',
      barcode: '012345678901'
    },
    {
      name: 'Granola Bar',
      description: 'Oats and honey granola bar',
      price: 1.99,
      sku: 'GRANOLA-001',
      barcode: '056789012345'
    }
  ]

  // Get or create the default category
  let category = await prisma.category.findFirst({
    where: { name: 'Beverages & Snacks' }
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Beverages & Snacks',
        description: 'Various beverages and snack items'
      }
    })
  }

  for (const productData of productsWithBarcodes) {
    // Check if product already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { barcode: productData.barcode },
          { sku: productData.sku }
        ]
      }
    })

    if (!existingProduct) {
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          sku: productData.sku,
          barcode: productData.barcode,
          categoryId: category.id
        }
      })

      // Create inventory record
      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: Math.floor(Math.random() * 100) + 10, // Random stock between 10-109
          minStock: 5,
          maxStock: 200,
          reorderPoint: 10,
          costPrice: productData.price * 0.6, // 60% of selling price
          location: 'Main Store'
        }
      })

      console.log(`Created product: ${product.name} with barcode: ${product.barcode}`)
    } else {
      console.log(`Product already exists: ${productData.name}`)
    }
  }

  console.log('Products with barcodes seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })