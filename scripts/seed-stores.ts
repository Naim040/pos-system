import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding stores...')

  // Create stores
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        name: 'Main Headquarters',
        code: 'HQ001',
        address: '123 Business Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        phone: '+1 (555) 123-4567',
        email: 'hq@company.com',
        timezone: 'America/New_York',
        currency: 'BDT',
        isActive: true,
        isHeadquarters: true,
        openingHours: JSON.stringify({
          monday: '9:00-18:00',
          tuesday: '9:00-18:00',
          wednesday: '9:00-18:00',
          thursday: '9:00-18:00',
          friday: '9:00-18:00',
          saturday: '10:00-16:00',
          sunday: 'closed'
        }),
        notes: 'Main headquarters and flagship store'
      }
    }),
    prisma.store.create({
      data: {
        name: 'Downtown Branch',
        code: 'DT001',
        address: '456 Downtown St',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA',
        phone: '+1 (555) 234-5678',
        email: 'downtown@company.com',
        timezone: 'America/New_York',
        currency: 'BDT',
        isActive: true,
        isHeadquarters: false,
        openingHours: JSON.stringify({
          monday: '8:00-20:00',
          tuesday: '8:00-20:00',
          wednesday: '8:00-20:00',
          thursday: '8:00-20:00',
          friday: '8:00-20:00',
          saturday: '9:00-18:00',
          sunday: '11:00-17:00'
        }),
        notes: 'Downtown location with extended hours'
      }
    }),
    prisma.store.create({
      data: {
        name: 'Westside Store',
        code: 'WS001',
        address: '789 Westside Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        country: 'USA',
        phone: '+1 (555) 345-6789',
        email: 'westside@company.com',
        timezone: 'America/Los_Angeles',
        currency: 'BDT',
        isActive: true,
        isHeadquarters: false,
        openingHours: JSON.stringify({
          monday: '9:00-18:00',
          tuesday: '9:00-18:00',
          wednesday: '9:00-18:00',
          thursday: '9:00-18:00',
          friday: '9:00-18:00',
          saturday: '10:00-16:00',
          sunday: 'closed'
        }),
        notes: 'West Coast flagship store'
      }
    }),
    prisma.store.create({
      data: {
        name: 'Chicago Branch',
        code: 'CH001',
        address: '321 Windy City Ave',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
        phone: '+1 (555) 456-7890',
        email: 'chicago@company.com',
        timezone: 'America/Chicago',
        currency: 'BDT',
        isActive: true,
        isHeadquarters: false,
        openingHours: JSON.stringify({
          monday: '8:00-19:00',
          tuesday: '8:00-19:00',
          wednesday: '8:00-19:00',
          thursday: '8:00-19:00',
          friday: '8:00-19:00',
          saturday: '9:00-17:00',
          sunday: '11:00-15:00'
        }),
        notes: 'Midwest regional store'
      }
    })
  ])

  console.log(`✅ Created ${stores.length} stores`)

  // Create user-store associations
  const users = await prisma.user.findMany()
  
  if (users.length > 0) {
    const userStores = await Promise.all([
      prisma.userStore.create({
        data: {
          userId: users[0].id,
          storeId: stores[0].id,
          role: 'admin'
        }
      }),
      prisma.userStore.create({
        data: {
          userId: users[1]?.id || users[0].id,
          storeId: stores[1].id,
          role: 'manager'
        }
      }),
      prisma.userStore.create({
        data: {
          userId: users[2]?.id || users[0].id,
          storeId: stores[2].id,
          role: 'manager'
        }
      })
    ])

    console.log(`✅ Created ${userStores.length} user-store associations`)
  }

  // Create sample store reports
  const storeReports = await Promise.all([
    prisma.storeReport.create({
      data: {
        storeId: stores[0].id,
        reportType: 'monthly',
        period: '2024-01',
        totalSales: 125000.50,
        totalProfit: 37500.15,
        totalTransactions: 850,
        averageTransaction: 147.06,
        topProducts: JSON.stringify([
          { name: 'Coffee', sales: 25000 },
          { name: 'Sandwich', sales: 18000 },
          { name: 'Soda', sales: 12000 }
        ]),
        customerMetrics: JSON.stringify({
          totalCustomers: 450,
          newCustomers: 85,
          returningCustomers: 365
        }),
        inventoryMetrics: JSON.stringify({
          totalProducts: 150,
          lowStockItems: 12,
          outOfStockItems: 2
        })
      }
    }),
    prisma.storeReport.create({
      data: {
        storeId: stores[1].id,
        reportType: 'monthly',
        period: '2024-01',
        totalSales: 98000.25,
        totalProfit: 29400.08,
        totalTransactions: 720,
        averageTransaction: 136.11,
        topProducts: JSON.stringify([
          { name: 'Coffee', sales: 20000 },
          { name: 'Chips', sales: 15000 },
          { name: 'Water Bottle', sales: 10000 }
        ]),
        customerMetrics: JSON.stringify({
          totalCustomers: 380,
          newCustomers: 65,
          returningCustomers: 315
        }),
        inventoryMetrics: JSON.stringify({
          totalProducts: 120,
          lowStockItems: 8,
          outOfStockItems: 1
        })
      }
    }),
    prisma.storeReport.create({
      data: {
        storeId: stores[2].id,
        reportType: 'monthly',
        period: '2024-01',
        totalSales: 87500.75,
        totalProfit: 26250.23,
        totalTransactions: 650,
        averageTransaction: 134.62,
        topProducts: JSON.stringify([
          { name: 'Coffee', sales: 18000 },
          { name: 'Cookie', sales: 12000 },
          { name: 'Soda', sales: 9000 }
        ]),
        customerMetrics: JSON.stringify({
          totalCustomers: 320,
          newCustomers: 55,
          returningCustomers: 265
        }),
        inventoryMetrics: JSON.stringify({
          totalProducts: 100,
          lowStockItems: 6,
          outOfStockItems: 0
        })
      }
    })
  ])

  console.log(`✅ Created ${storeReports.length} store reports`)

  // Create sample stock transfers
  const stockTransfers = await Promise.all([
    prisma.stockTransfer.create({
      data: {
        transferNumber: 'TRF-202401-001',
        fromStoreId: stores[0].id,
        toStoreId: stores[1].id,
        status: 'completed',
        transferDate: new Date('2024-01-15'),
        completedDate: new Date('2024-01-16'),
        notes: 'Monthly inventory restocking',
        requestedBy: 'admin',
        approvedBy: 'manager',
        items: {
          create: [
            {
              productId: '1', // Assuming product with ID 1 exists
              quantity: 50,
              unitCost: 2.50,
              notes: 'Coffee beans'
            },
            {
              productId: '2', // Assuming product with ID 2 exists
              quantity: 25,
              unitCost: 6.00,
              notes: 'Sandwich ingredients'
            }
          ]
        }
      }
    }),
    prisma.stockTransfer.create({
      data: {
        transferNumber: 'TRF-202401-002',
        fromStoreId: stores[0].id,
        toStoreId: stores[2].id,
        status: 'in_transit',
        transferDate: new Date('2024-01-20'),
        expectedDate: new Date('2024-01-25'),
        notes: 'Emergency supply transfer',
        requestedBy: 'admin',
        approvedBy: 'manager',
        items: {
          create: [
            {
              productId: '3', // Assuming product with ID 3 exists
              quantity: 100,
              unitCost: 1.00,
              notes: 'Water bottles'
            },
            {
              productId: '4', // Assuming product with ID 4 exists
              quantity: 75,
              unitCost: 2.00,
              notes: 'Chips'
            }
          ]
        }
      }
    }),
    prisma.stockTransfer.create({
      data: {
        transferNumber: 'TRF-202401-003',
        fromStoreId: stores[1].id,
        toStoreId: stores[3].id,
        status: 'pending',
        transferDate: new Date('2024-01-22'),
        expectedDate: new Date('2024-01-28'),
        notes: 'Seasonal inventory transfer',
        requestedBy: 'manager',
        items: {
          create: [
            {
              productId: '5', // Assuming product with ID 5 exists
              quantity: 40,
              unitCost: 1.50,
              notes: 'Soda cans'
            },
            {
              productId: '6', // Assuming product with ID 6 exists
              quantity: 30,
              unitCost: 1.75,
              notes: 'Cookies'
            }
          ]
        }
      }
    })
  ])

  console.log(`✅ Created ${stockTransfers.length} stock transfers`)

  console.log('🎉 Store seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding stores:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })