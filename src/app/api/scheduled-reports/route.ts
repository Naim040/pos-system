import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const isActive = searchParams.get('isActive')

    const whereClause: any = {}
    if (storeId) whereClause.storeId = storeId
    if (isActive !== null) whereClause.isActive = isActive === 'true'

    const scheduledReports = await db.scheduledReport.findMany({
      where: whereClause,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
            category: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            reportInstances: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(scheduledReports)
  } catch (error) {
    console.error('Error fetching scheduled reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      templateId,
      storeId,
      frequency,
      schedule,
      format,
      delivery,
      recipients,
      isActive
    } = body

    // Validate required fields
    if (!name || !templateId || !frequency || !schedule || !format || !delivery) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if template exists
    const template = await db.reportTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // If storeId is provided, check if store exists
    if (storeId) {
      const store = await db.store.findUnique({
        where: { id: storeId }
      })

      if (!store) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        )
      }
    }

    // Calculate next run time based on schedule
    const nextRun = new Date()
    // This is a simplified calculation - in production, you'd use a proper cron parser
    if (frequency === 'daily') {
      nextRun.setDate(nextRun.getDate() + 1)
    } else if (frequency === 'weekly') {
      nextRun.setDate(nextRun.getDate() + 7)
    } else if (frequency === 'monthly') {
      nextRun.setMonth(nextRun.getMonth() + 1)
    } else if (frequency === 'quarterly') {
      nextRun.setMonth(nextRun.getMonth() + 3)
    } else if (frequency === 'yearly') {
      nextRun.setFullYear(nextRun.getFullYear() + 1)
    }

    const scheduledReport = await db.scheduledReport.create({
      data: {
        name,
        templateId,
        storeId,
        frequency,
        schedule,
        format,
        delivery,
        recipients: recipients || null,
        isActive: isActive !== undefined ? isActive : true,
        nextRun,
        createdBy: 'system' // In real app, get from authenticated user
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
            category: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    return NextResponse.json(scheduledReport)
  } catch (error) {
    console.error('Error creating scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to create scheduled report' },
      { status: 500 }
    )
  }
}