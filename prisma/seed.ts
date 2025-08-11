import { db } from '../src/lib/db'

async function main() {
  // Create default users
  const users = [
    {
      email: 'admin@pos.com',
      name: 'Admin User',
      role: 'admin'
    },
    {
      email: 'superadmin@pos.com',
      name: 'Super Admin User',
      role: 'SUPER_ADMIN'
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

  for (const userData of users) {
    const existingUser = await db.user.findUnique({
      where: { email: userData.email }
    })

    if (!existingUser) {
      await db.user.create({
        data: userData
      })
      console.log(`Created user: ${userData.email}`)
    } else {
      console.log(`User already exists: ${userData.email}`)
    }
  }

  // Create default app settings
  const existingSettings = await db.appSettings.findUnique({
    where: { id: '1' }
  })

  if (!existingSettings) {
    await db.appSettings.create({
      data: {
        id: '1',
        contactPhone: '01938264923',
        developerCredit: 'Developed by Halalzi',
        developerUrl: null
      }
    })
    console.log('Created default app settings')
  } else {
    console.log('App settings already exist')
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })