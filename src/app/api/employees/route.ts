import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const employees = await db.user.findMany({
      where: {
        role: {
          in: ['admin', 'staff', 'manager']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        department: true,
        position: true,
        salary: true,
        hourlyRate: true,
        status: true,
        hireDate: true,
        employeeId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get additional metrics for each employee
    const employeesWithMetrics = await Promise.all(
      employees.map(async (employee) => {
        // Get total hours from time entries
        const timeEntries = await db.timeEntry.findMany({
          where: {
            userId: employee.id,
            status: 'completed'
          }
        })

        const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)

        // Get average rating from performance reviews
        const reviews = await db.performanceReview.findMany({
          where: {
            userId: employee.id,
            status: 'completed'
          }
        })

        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0

        // Get current clock-in status
        const activeTimeEntry = await db.timeEntry.findFirst({
          where: {
            userId: employee.id,
            status: 'active'
          }
        })

        return {
          ...employee,
          totalHours,
          averageRating,
          isClockedIn: !!activeTimeEntry,
          lastClockIn: activeTimeEntry?.clockIn || null
        }
      })
    )

    return NextResponse.json(employeesWithMetrics)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const employee = await db.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.role || 'staff',
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country,
        department: body.department,
        position: body.position,
        salary: body.salary,
        hourlyRate: body.hourlyRate,
        status: body.status || 'active',
        hireDate: body.hireDate ? new Date(body.hireDate) : null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        employeeId: body.employeeId,
        emergencyContact: body.emergencyContact,
        emergencyPhone: body.emergencyPhone,
        notes: body.notes
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        department: true,
        position: true,
        salary: true,
        hourlyRate: true,
        status: true,
        hireDate: true,
        employeeId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}