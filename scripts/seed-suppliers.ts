import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding suppliers...')

  const suppliers = [
    {
      name: 'Global Food Supplies Inc.',
      contactPerson: 'John Smith',
      email: 'john@globalfood.com',
      phone: '+1-555-0123',
      address: '123 Food Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      website: 'https://globalfood.com',
      taxId: 'TAX123456789',
      paymentTerms: 'net30',
      notes: 'Primary food supplier, reliable delivery'
    },
    {
      name: 'Beverage Wholesale Co.',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@beveragewholesale.com',
      phone: '+1-555-0456',
      address: '456 Drink Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
      website: 'https://beveragewholesale.com',
      paymentTerms: 'net15',
      notes: 'Specializes in beverages and drinks'
    },
    {
      name: 'Snack Distributors Ltd.',
      contactPerson: 'Mike Wilson',
      email: 'mike@snackdist.com',
      phone: '+1-555-0789',
      address: '789 Snack Road',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60001',
      country: 'USA',
      website: 'https://snackdist.com',
      paymentTerms: 'cod',
      notes: 'Wide variety of snacks and packaged goods'
    }
  ]

  for (const supplierData of suppliers) {
    const supplier = await prisma.supplier.create({
      data: supplierData
    })
    console.log(`Created supplier: ${supplier.name}`)
  }

  console.log('Suppliers seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })