import { db } from '@/lib/db'

async function seedCategories() {
  try {
    const defaultCategories = [
      { name: 'Beverages', description: 'Drinks and beverages' },
      { name: 'Food', description: 'Food items and meals' },
      { name: 'Snacks', description: 'Snacks and confectionery' },
      { name: 'Electronics', description: 'Electronic devices' },
      { name: 'Clothing', description: 'Apparel and accessories' },
      { name: 'Home & Garden', description: 'Home and garden products' },
      { name: 'Health & Beauty', description: 'Health and beauty products' },
      { name: 'Sports & Outdoors', description: 'Sports and outdoor equipment' }
    ]

    for (const category of defaultCategories) {
      await db.category.upsert({
        where: { name: category.name },
        update: {},
        create: category
      })
    }

    console.log('Default categories seeded successfully')
  } catch (error) {
    console.error('Error seeding categories:', error)
  } finally {
    await db.$disconnect()
  }
}

seedCategories()