import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schedule = await db.reportSchedule.findUnique({
      where: { id: params.id },
      include: {
        reportRuns: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Report schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching report schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report schedule' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (frequency !== undefined) {
      updateData.frequency = frequency
      // Recalculate next run time if frequency changed
      updateData.nextRun = calculateNextRun(frequency, timezone || 'UTC')
    }
    if (format !== undefined) updateData.format = format
    if (config !== undefined) {
      try {
        updateData.config = JSON.stringify(config)
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JSON in config' },
          { status: 400 }
        )
      }
    }
    if (recipients !== undefined) {
      try {
        updateData.recipients = JSON.stringify(recipients)
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JSON in recipients' },
          { status: 400 }
        )
      }
    }
    if (isActive !== undefined) updateData.isActive = isActive
    if (timezone !== undefined) updateData.timezone = timezone

    const schedule = await db.reportSchedule.update({
      where: { id: params.id },
      data: updateData,
      include: {
        reportRuns: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error updating report schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update report schedule' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete report runs first
    await db.reportRun.deleteMany({
      where: { scheduleId: params.id }
    })

    // Delete schedule
    await db.reportSchedule.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Report schedule deleted successfully' })
  } catch (error) {
    console.error('Error deleting report schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete report schedule' },
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