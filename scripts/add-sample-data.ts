import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding sample data...')

  // Add sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Bakery' },
      update: {},
      create: {
        name: 'Bakery',
        description: 'Fresh baked goods and pastries'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: {
        name: 'Beverages',
        description: 'Drinks and liquid refreshments'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: {
        name: 'Snacks',
        description: 'Packaged snacks and convenience foods'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Dairy' },
      update: {},
      create: {
        name: 'Dairy',
        description: 'Milk, cheese, and dairy products'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Frozen Foods' },
      update: {},
      create: {
        name: 'Frozen Foods',
        description: 'Frozen meals and vegetables'
      }
    })
  ])

  // Add sample brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: 'Coca-Cola' },
      update: {},
      create: {
        name: 'Coca-Cola',
        description: 'Global beverage company',
        website: 'https://coca-cola.com'
      }
    }),
    prisma.brand.upsert({
      where: { name: 'Pepsi' },
      update: {},
      create: {
        name: 'Pepsi',
        description: 'Global beverage company',
        website: 'https://pepsi.com'
      }
    }),
    prisma.brand.upsert({
      where: { name: 'Nestlé' },
      update: {},
      create: {
        name: 'Nestlé',
        description: 'Food and beverage company',
        website: 'https://nestle.com'
      }
    }),
    prisma.brand.upsert({
      where: { name: 'Kellogg\'s' },
      update: {},
      create: {
        name: 'Kellogg\'s',
        description: 'Breakfast and snack foods company',
        website: 'https://kelloggs.com'
      }
    }),
    prisma.brand.upsert({
      where: { name: 'Unilever' },
      update: {},
      create: {
        name: 'Unilever',
        description: 'Consumer goods company',
        website: 'https://unilever.com'
      }
    })
  ])

  // Add sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'COKE-001' },
      update: {},
      create: {
        name: 'Coca-Cola',
        description: 'Classic carbonated soft drink',
        price: 2.50,
        sku: 'COKE-001',
        barcode: '049000001234',
        categoryId: categories[1].id, // Beverages
        brandId: brands[0].id, // Coca-Cola
        isSerialized: false,
        isBatched: false,
        hasVariations: false
      }
    }),
    prisma.product.upsert({
      where: { sku: 'PEPSI-001' },
      update: {},
      create: {
        name: 'Pepsi',
        description: 'Classic carbonated soft drink',
        price: 2.50,
        sku: 'PEPSI-001',
        barcode: '012000001234',
        categoryId: categories[1].id, // Beverages
        brandId: brands[1].id, // Pepsi
        isSerialized: false,
        isBatched: false,
        hasVariations: false
      }
    }),
    prisma.product.upsert({
      where: { sku: 'BREAD-001' },
      update: {},
      create: {
        name: 'Whole Wheat Bread',
        description: 'Fresh whole wheat bread',
        price: 3.99,
        sku: 'BREAD-001',
        barcode: '078000001234',
        categoryId: categories[0].id, // Bakery
        brandId: brands[2].id, // Nestlé
        isSerialized: false,
        isBatched: true,
        hasVariations: false
      }
    }),
    prisma.product.upsert({
      where: { sku: 'CHIPS-001' },
      update: {},
      create: {
        name: 'Potato Chips',
        description: 'Crispy salted potato chips',
        price: 1.99,
        sku: 'CHIPS-001',
        barcode: '088000001234',
        categoryId: categories[2].id, // Snacks
        brandId: brands[3].id, // Kellogg's
        isSerialized: false,
        isBatched: false,
        hasVariations: false
      }
    }),
    prisma.product.upsert({
      where: { sku: 'MILK-001' },
      update: {},
      create: {
        name: 'Whole Milk',
        description: 'Fresh whole milk',
        price: 4.99,
        sku: 'MILK-001',
        barcode: '099000001234',
        categoryId: categories[3].id, // Dairy
        brandId: brands[2].id, // Nestlé
        isSerialized: false,
        isBatched: true,
        hasVariations: false
      }
    }),
    prisma.product.upsert({
      where: { sku: 'PIZZA-001' },
      update: {},
      create: {
        name: 'Frozen Pizza',
        description: 'Pepperoni frozen pizza',
        price: 8.99,
        sku: 'PIZZA-001',
        barcode: '055000001234',
        categoryId: categories[4].id, // Frozen Foods
        brandId: brands[4].id, // Unilever
        isSerialized: false,
        isBatched: false,
        hasVariations: false
      }
    })
  ])

  // Add inventory for products
  const store = await prisma.store.findFirst()
  if (!store) {
    throw new Error('No store found in database')
  }

  const inventory = await Promise.all(
    products.map(product =>
      prisma.inventory.upsert({
        where: {
          productId_storeId: {
            productId: product.id,
            storeId: store.id
          }
        },
        update: {},
        create: {
          productId: product.id,
          storeId: store.id,
          quantity: 50,
          minStock: 10,
          maxStock: 200,
          reorderPoint: 15,
          costPrice: product.price * 0.7, // 70% of selling price
          isActive: true
        }
      })
    )
  )

  console.log('Sample data added successfully!')
  console.log(`Categories: ${categories.length}`)
  console.log(`Brands: ${brands.length}`)
  console.log(`Products: ${products.length}`)
  console.log(`Inventory items: ${inventory.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })