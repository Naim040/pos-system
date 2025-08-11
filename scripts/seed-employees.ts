import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding employees...')

  // Create sample employees
  const employees = [
    {
      email: 'john.smith@company.com',
      name: 'John Smith',
      role: 'manager',
      phone: '+1-555-0123',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      department: 'Operations',
      position: 'Store Manager',
      salary: 55000,
      status: 'active',
      hireDate: new Date('2023-01-15'),
      employeeId: 'EMP001',
      emergencyContact: 'Jane Smith',
      emergencyPhone: '+1-555-0124',
      notes: 'Experienced store manager with 5+ years in retail'
    },
    {
      email: 'sarah.johnson@company.com',
      name: 'Sarah Johnson',
      role: 'staff',
      phone: '+1-555-0125',
      address: '456 Oak Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      country: 'USA',
      department: 'Sales',
      position: 'Sales Associate',
      hourlyRate: 18.50,
      status: 'active',
      hireDate: new Date('2023-03-20'),
      employeeId: 'EMP002',
      emergencyContact: 'Mike Johnson',
      emergencyPhone: '+1-555-0126',
      notes: 'Excellent customer service skills'
    },
    {
      email: 'mike.wilson@company.com',
      name: 'Mike Wilson',
      role: 'staff',
      phone: '+1-555-0127',
      address: '789 Pine Rd',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      country: 'USA',
      department: 'Sales',
      position: 'Cashier',
      hourlyRate: 16.75,
      status: 'active',
      hireDate: new Date('2023-06-10'),
      employeeId: 'EMP003',
      emergencyContact: 'Lisa Wilson',
      emergencyPhone: '+1-555-0128',
      notes: 'Fast and efficient cashier'
    },
    {
      email: 'emily.brown@company.com',
      name: 'Emily Brown',
      role: 'staff',
      phone: '+1-555-0129',
      address: '321 Elm St',
      city: 'Queens',
      state: 'NY',
      zipCode: '11301',
      country: 'USA',
      department: 'Sales',
      position: 'Sales Associate',
      hourlyRate: 17.25,
      status: 'active',
      hireDate: new Date('2023-08-15'),
      employeeId: 'EMP004',
      emergencyContact: 'David Brown',
      emergencyPhone: '+1-555-0130',
      notes: 'Great with upselling and product knowledge'
    },
    {
      email: 'david.lee@company.com',
      name: 'David Lee',
      role: 'staff',
      phone: '+1-555-0131',
      address: '654 Maple Dr',
      city: 'Bronx',
      state: 'NY',
      zipCode: '10401',
      country: 'USA',
      department: 'Operations',
      position: 'Inventory Specialist',
      hourlyRate: 19.00,
      status: 'on_leave',
      hireDate: new Date('2022-11-01'),
      employeeId: 'EMP005',
      emergencyContact: 'Anna Lee',
      emergencyPhone: '+1-555-0132',
      notes: 'Currently on medical leave'
    }
  ]

  for (const employee of employees) {
    await prisma.user.upsert({
      where: { email: employee.email },
      update: employee,
      create: employee
    })
  }

  console.log('Employees seeded successfully!')

  // Get the created users to use their IDs
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: employees.map(e => e.email)
      }
    }
  })

  const userMap = new Map(users.map(user => [user.email, user.id]))

  // Create sample time entries
  console.log('Seeding time entries...')
  
  const timeEntries = [
    {
      userId: userMap.get('john.smith@company.com'), // John Smith
      clockIn: new Date('2024-01-15T09:00:00Z'),
      clockOut: new Date('2024-01-15T17:30:00Z'),
      totalHours: 8.5,
      overtimeHours: 0.5,
      status: 'completed',
      notes: 'Regular shift with overtime'
    },
    {
      userId: userMap.get('sarah.johnson@company.com'), // Sarah Johnson
      clockIn: new Date('2024-01-15T08:30:00Z'),
      clockOut: new Date('2024-01-15T16:30:00Z'),
      totalHours: 8.0,
      overtimeHours: 0,
      status: 'completed',
      notes: 'Regular shift'
    },
    {
      userId: userMap.get('mike.wilson@company.com'), // Mike Wilson
      clockIn: new Date('2024-01-15T10:00:00Z'),
      clockOut: new Date('2024-01-15T18:00:00Z'),
      totalHours: 8.0,
      overtimeHours: 0,
      status: 'completed',
      notes: 'Late shift'
    },
    {
      userId: userMap.get('emily.brown@company.com'), // Emily Brown
      clockIn: new Date('2024-01-15T09:00:00Z'),
      clockOut: new Date('2024-01-15T17:00:00Z'),
      totalHours: 8.0,
      overtimeHours: 0,
      status: 'completed',
      notes: 'Regular shift'
    },
    {
      userId: userMap.get('sarah.johnson@company.com'), // Sarah Johnson - currently active
      clockIn: new Date(),
      status: 'active',
      notes: 'Currently working'
    }
  ]

  for (const entry of timeEntries) {
    if (entry.userId) {
      await prisma.timeEntry.create({
        data: entry
      })
    }
  }

  console.log('Time entries seeded successfully!')

  // Create sample performance reviews
  console.log('Seeding performance reviews...')
  
  const performanceReviews = [
    {
      userId: userMap.get('john.smith@company.com'), // John Smith
      reviewerId: userMap.get('john.smith@company.com'), // Self-review or admin
      reviewDate: new Date('2024-01-10'),
      period: 'quarterly',
      rating: 4.5,
      productivityRating: 4.5,
      customerServiceRating: 4.3,
      teamworkRating: 4.7,
      reliabilityRating: 4.5,
      strengths: 'Excellent leadership skills, great team management',
      improvements: 'Could improve on delegation tasks',
      goals: 'Increase team productivity by 10%',
      comments: 'Outstanding performance overall',
      status: 'completed'
    },
    {
      userId: userMap.get('sarah.johnson@company.com'), // Sarah Johnson
      reviewerId: userMap.get('john.smith@company.com'), // John Smith
      reviewDate: new Date('2024-01-08'),
      period: 'quarterly',
      rating: 4.2,
      productivityRating: 4.0,
      customerServiceRating: 4.5,
      teamworkRating: 4.1,
      reliabilityRating: 4.2,
      strengths: 'Great customer service, friendly attitude',
      improvements: 'Could work on upselling techniques',
      goals: 'Improve sales conversion rate',
      comments: 'Strong performer with excellent customer skills',
      status: 'completed'
    },
    {
      userId: userMap.get('mike.wilson@company.com'), // Mike Wilson
      reviewerId: userMap.get('john.smith@company.com'), // John Smith
      reviewDate: new Date('2024-01-05'),
      period: 'quarterly',
      rating: 3.8,
      productivityRating: 3.9,
      customerServiceRating: 3.7,
      teamworkRating: 3.8,
      reliabilityRating: 3.8,
      strengths: 'Fast and efficient at checkout',
      improvements: 'Could improve customer engagement',
      goals: 'Reduce checkout time by 15%',
      comments: 'Good performance, room for improvement in customer interaction',
      status: 'completed'
    }
  ]

  for (const review of performanceReviews) {
    if (review.userId && review.reviewerId) {
      await prisma.performanceReview.create({
        data: review
      })
    }
  }

  console.log('Performance reviews seeded successfully!')

  // Create sample payroll records
  console.log('Seeding payroll records...')
  
  const payrollRecords = [
    {
      userId: userMap.get('john.smith@company.com'), // John Smith
      period: 'monthly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      regularHours: 160,
      overtimeHours: 8,
      regularPay: 4583.33,
      overtimePay: 458.33,
      bonus: 500,
      deductions: 200,
      taxes: 1200,
      netPay: 4541.66,
      status: 'paid',
      paymentDate: new Date('2024-01-31'),
      paymentMethod: 'direct_deposit',
      notes: 'January payroll with bonus'
    },
    {
      userId: userMap.get('sarah.johnson@company.com'), // Sarah Johnson
      period: 'monthly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      regularHours: 140,
      overtimeHours: 5,
      regularPay: 2590.00,
      overtimePay: 138.75,
      deductions: 150,
      taxes: 650,
      netPay: 2528.75,
      status: 'processed',
      notes: 'January payroll'
    },
    {
      userId: userMap.get('mike.wilson@company.com'), // Mike Wilson
      period: 'monthly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      regularHours: 120,
      overtimeHours: 0,
      regularPay: 2010.00,
      overtimePay: 0,
      deductions: 120,
      taxes: 480,
      netPay: 1810.00,
      status: 'processed',
      notes: 'January payroll - part-time hours'
    },
    {
      userId: userMap.get('emily.brown@company.com'), // Emily Brown
      period: 'monthly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      regularHours: 135,
      overtimeHours: 3,
      regularPay: 2328.75,
      overtimePay: 77.25,
      deductions: 130,
      taxes: 580,
      netPay: 2296.00,
      status: 'processed',
      notes: 'January payroll'
    }
  ]

  for (const record of payrollRecords) {
    if (record.userId) {
      await prisma.payrollRecord.create({
        data: record
      })
    }
  }

  console.log('Payroll records seeded successfully!')
  console.log('Employee management data seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })