import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    
    const whereClause: any = {}
    if (isActive === 'true') whereClause.isActive = true
    if (isActive === 'false') whereClause.isActive = false

    const schedules = await db.reportSchedule.findMany({
      where: whereClause,
      include: {
        reportRuns: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching report schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report schedules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      description,
      type,
      frequency,
      format,
      config,
      recipients,
      isActive,
      timezone
    } = body

    // Validate required fields
    if (!name || !type || !frequency || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse JSON fields
    let parsedConfig = {}
    let parsedRecipients = []
    
    try {
      parsedConfig = config ? JSON.parse(config) : {}
      parsedRecipients = recipients ? JSON.parse(recipients) : []
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in config or recipients' },
        { status: 400 }
      )
    }

    // Calculate next run time based on frequency
    const nextRun = calculateNextRun(frequency, timezone)

    const schedule = await db.reportSchedule.create({
      data: {
        name,
        description,
        type,
        frequency,
        format,
        config: JSON.stringify(parsedConfig),
        recipients: JSON.stringify(parsedRecipients),
        isActive: isActive !== false,
        timezone: timezone || 'UTC',
        nextRun,
        createdBy: 'system' // In real app, get from authenticated user
      },
      include: {
        reportRuns: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error creating report schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create report schedule' },
      { status: 500 }
    )
  }
}

function calculateNextRun(frequency: string, timezone: string): Date {
  const now = new Date()
  const nextRun = new Date(now)

  switch (frequency) {
    case 'daily':
      nextRun.setDate(now.getDate() + 1)
      nextRun.setHours(0, 0, 0, 0)
      break
    case 'weekly':
      nextRun.setDate(now.getDate() + 7)
      nextRun.setHours(0, 0, 0, 0)
      break
    case 'monthly':
      nextRun.setMonth(now.getMonth() + 1)
      nextRun.setDate(1)
      nextRun.setHours(0, 0, 0, 0)
      break
    case 'quarterly':
      nextRun.setMonth(now.getMonth() + 3)
      nextRun.setDate(1)
      nextRun.setHours(0, 0, 0, 0)
      break
    case 'yearly':
      nextRun.setFullYear(now.getFullYear() + 1)
      nextRun.setMonth(0)
      nextRun.setDate(1)
      nextRun.setHours(0, 0, 0, 0)
      break
    default:
      nextRun.setDate(now.getDate() + 1)
      nextRun.setHours(0, 0, 0, 0)
  }

  return nextRun
}