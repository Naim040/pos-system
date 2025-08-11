import { db } from '@/lib/db'

async function seedProducts() {
  try {
    // Get categories
    const categories = await db.category.findMany()
    const beveragesCategory = categories.find(c => c.name === 'Beverages')
    const foodCategory = categories.find(c => c.name === 'Food')
    const snacksCategory = categories.find(c => c.name === 'Snacks')

    if (!beveragesCategory || !foodCategory || !snacksCategory) {
      throw new Error('Required categories not found')
    }

    const sampleProducts = [
      {
        name: 'Coffee',
        description: 'Fresh brewed coffee',
        price: 3.50,
        sku: 'COF001',
        categoryId: beveragesCategory.id
      },
      {
        name: 'Sandwich',
        description: 'Club sandwich',
        price: 8.99,
        sku: 'SND001',
        categoryId: foodCategory.id
      },
      {
        name: 'Water Bottle',
        description: '500ml water',
        price: 1.50,
        sku: 'WAT001',
        categoryId: beveragesCategory.id
      },
      {
        name: 'Chips',
        description: 'Potato chips',
        price: 2.99,
        sku: 'CHP001',
        categoryId: snacksCategory.id
      },
      {
        name: 'Soda',
        description: 'Coca Cola',
        price: 2.50,
        sku: 'SOD001',
        categoryId: beveragesCategory.id
      },
      {
        name: 'Cookie',
        description: 'Chocolate chip cookie',
        price: 2.25,
        sku: 'CKI001',
        categoryId: snacksCategory.id
      }
    ]

    for (const product of sampleProducts) {
      await db.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product
      })
    }

    // Create inventory records for products
    const products = await db.product.findMany()
    const store = await db.store.findFirst()
    
    if (!store) {
      throw new Error('No store found')
    }
    
    for (const product of products) {
      await db.inventory.upsert({
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
          quantity: 100,
          minStock: 10,
          maxStock: 200
        }
      })
    }

    console.log('Sample products and inventory seeded successfully')
  } catch (error) {
    console.error('Error seeding products:', error)
  } finally {
    await db.$disconnect()
  }
}

seedProducts()