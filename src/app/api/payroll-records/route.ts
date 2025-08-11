import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const period = searchParams.get('period')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = {}
    if (userId) whereClause.userId = userId
    if (status) whereClause.status = status
    if (period) whereClause.period = period

    const payrollRecords = await db.payrollRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Format the response
    const formattedRecords = payrollRecords.map(record => ({
      id: record.id,
      userId: record.userId,
      userName: record.user.name,
      period: record.period,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate.toISOString(),
      regularHours: record.regularHours,
      overtimeHours: record.overtimeHours,
      regularPay: record.regularPay,
      overtimePay: record.overtimePay,
      bonus: record.bonus,
      deductions: record.deductions,
      taxes: record.taxes,
      netPay: record.netPay,
      status: record.status,
      paymentDate: record.paymentDate?.toISOString(),
      paymentMethod: record.paymentMethod,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedRecords)
  } catch (error) {
    console.error('Error fetching payroll records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payroll records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const payrollRecord = await db.payrollRecord.create({
      data: {
        userId: body.userId,
        period: body.period,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        regularHours: body.regularHours,
        overtimeHours: body.overtimeHours,
        regularPay: body.regularPay,
        overtimePay: body.overtimePay,
        bonus: body.bonus,
        deductions: body.deductions,
        taxes: body.taxes,
        netPay: body.netPay,
        status: body.status || 'pending',
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        paymentMethod: body.paymentMethod,
        notes: body.notes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      id: payrollRecord.id,
      userId: payrollRecord.userId,
      userName: payrollRecord.user.name,
      period: payrollRecord.period,
      startDate: payrollRecord.startDate.toISOString(),
      endDate: payrollRecord.endDate.toISOString(),
      regularHours: payrollRecord.regularHours,
      overtimeHours: payrollRecord.overtimeHours,
      regularPay: payrollRecord.regularPay,
      overtimePay: payrollRecord.overtimePay,
      bonus: payrollRecord.bonus,
      deductions: payrollRecord.deductions,
      taxes: payrollRecord.taxes,
      netPay: payrollRecord.netPay,
      status: payrollRecord.status,
      paymentDate: payrollRecord.paymentDate?.toISOString(),
      paymentMethod: payrollRecord.paymentMethod,
      notes: payrollRecord.notes,
      createdAt: payrollRecord.createdAt.toISOString(),
      updatedAt: payrollRecord.updatedAt.toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll record:', error)
    return NextResponse.json(
      { error: 'Failed to create payroll record' },
      { status: 500 }
    )
  }
}