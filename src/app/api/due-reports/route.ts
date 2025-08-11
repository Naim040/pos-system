import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'receivable' or 'payable'
    const status = searchParams.get('status')
    
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }
    
    const dueReports = await db.dueReport.findMany({
      where,
      orderBy: {
        dueDate: 'asc'
      }
    })
    
    return NextResponse.json(dueReports)
  } catch (error) {
    console.error('Error fetching due reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch due reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const dueReport = await db.dueReport.create({
      data: {
        type: data.type,
        entityId: data.entityId,
        entityName: data.entityName,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount || 0,
        dueAmount: data.dueAmount || (data.totalAmount - (data.paidAmount || 0)),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'pending'
      }
    })
    
    return NextResponse.json(dueReport)
  } catch (error) {
    console.error('Error creating due report:', error)
    return NextResponse.json(
      { error: 'Failed to create due report' },
      { status: 500 }
    )
  }
}