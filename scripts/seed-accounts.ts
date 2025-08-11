import { PrismaClient } from '@prisma/client'
import { db } from '../src/lib/db'

const prisma = new PrismaClient()

async function seedAccounts() {
  try {
    console.log('Seeding accounts management data...')

    // Create default expense categories
    const expenseCategories = await Promise.all([
      db.expenseCategory.create({
        data: {
          name: 'Electricity',
          description: 'Electricity and utility bills'
        }
      }),
      db.expenseCategory.create({
        data: {
          name: 'Internet',
          description: 'Internet and communication expenses'
        }
      }),
      db.expenseCategory.create({
        data: {
          name: 'Staff Salaries',
          description: 'Employee salaries and wages'
        }
      }),
      db.expenseCategory.create({
        data: {
          name: 'Rent',
          description: 'Shop/office rent'
        }
      }),
      db.expenseCategory.create({
        data: {
          name: 'Maintenance',
          description: 'Equipment and facility maintenance'
        }
      }),
      db.expenseCategory.create({
        data: {
          name: 'Office Supplies',
          description: 'Office and administrative supplies'
        }
      }),
      db.expenseCategory.create({
        data: {
          name: 'Marketing',
          description: 'Marketing and advertising expenses'
        }
      }),
      db.expenseCategory.create({
        data: {
          name: 'Transportation',
          description: 'Vehicle and transportation expenses'
        }
      }),
      db.expenseCategory.create({
        data: {
          name: 'Insurance',
          description: 'Business insurance premiums'
        }
      }),
      db.expenseCategory.create({
        data: {
          name: 'Other',
          description: 'Miscellaneous expenses'
        }
      })
    ])

    // Create default accounts
    const accounts = await Promise.all([
      db.account.create({
        data: {
          name: 'Petty Cash',
          type: 'asset',
          subtype: 'cash',
          accountNumber: 'CASH-001',
          description: 'Petty cash for daily expenses',
          currency: 'BDT',
          balance: 1000
        }
      }),
      db.account.create({
        data: {
          name: 'Accounts Receivable',
          type: 'asset',
          subtype: 'accounts_receivable',
          accountNumber: 'AR-001',
          description: 'Money owed by customers',
          currency: 'BDT',
          balance: 0
        }
      }),
      db.account.create({
        data: {
          name: 'Accounts Payable',
          type: 'liability',
          subtype: 'accounts_payable',
          accountNumber: 'AP-001',
          description: 'Money owed to suppliers',
          currency: 'BDT',
          balance: 0
        }
      }),
      db.account.create({
        data: {
          name: 'Sales Revenue',
          type: 'revenue',
          subtype: 'income',
          accountNumber: 'SALES-001',
          description: 'Revenue from sales',
          currency: 'BDT',
          balance: 0
        }
      }),
      db.account.create({
        data: {
          name: 'Operating Expenses',
          type: 'expense',
          subtype: 'operating_expense',
          accountNumber: 'EXP-001',
          description: 'Daily operating expenses',
          currency: 'BDT',
          balance: 0
        }
      })
    ])

    console.log('✅ Accounts management data seeded successfully!')
    console.log(`Created ${expenseCategories.length} expense categories`)
    console.log(`Created ${accounts.length} default accounts`)

  } catch (error) {
    console.error('Error seeding accounts data:', error)
    throw error
  }
}

// Run the seed function
seedAccounts()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })