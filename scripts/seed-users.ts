import { db } from '@/lib/db'

async function seedUsers() {
  try {
    const defaultUsers = [
      {
        email: 'admin@pos.com',
        name: 'Admin User',
        role: 'admin'
      },
      {
        email: 'manager@pos.com',
        name: 'Manager User',
        role: 'manager'
      },
      {
        email: 'staff@pos.com',
        name: 'Staff User',
        role: 'staff'
      }
    ]

    for (const user of defaultUsers) {
      await db.user.upsert({
        where: { email: user.email },
        update: {},
        create: user
      })
    }

    console.log('Default users seeded successfully')
  } catch (error) {
    console.error('Error seeding users:', error)
  } finally {
    await db.$disconnect()
  }
}

seedUsers()