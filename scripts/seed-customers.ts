import { db } from '@/lib/db'

async function seedCustomers() {
  try {
    const sampleCustomers = [
      {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        notes: 'Regular customer, prefers coffee products'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+1-555-0124',
        company: 'Tech Solutions',
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        notes: 'VIP customer, always orders sandwiches'
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@email.com',
        phone: '+1-555-0125',
        company: null,
        address: '789 Pine Rd',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
        notes: 'New customer, potential for loyalty program'
      },
      {
        name: 'Alice Brown',
        email: 'alice.brown@email.com',
        phone: '+1-555-0126',
        company: 'Digital Agency',
        address: '321 Elm St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
        notes: 'Frequent visitor, likes healthy options'
      },
      {
        name: 'Charlie Wilson',
        email: 'charlie.wilson@email.com',
        phone: '+1-555-0127',
        company: null,
        address: '654 Maple Dr',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        country: 'USA',
        notes: 'Student, budget-conscious'
      }
    ]

    for (const customer of sampleCustomers) {
      await db.customer.upsert({
        where: { email: customer.email || `temp-${Date.now()}` },
        update: {},
        create: customer
      })
    }

    console.log('Sample customers seeded successfully')
  } catch (error) {
    console.error('Error seeding customers:', error)
  } finally {
    await db.$disconnect()
  }
}

seedCustomers()