import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = {}
    if (userId) whereClause.userId = userId
    if (status) whereClause.status = status

    const timeEntries = await db.timeEntry.findMany({
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
        clockIn: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Format the response
    const formattedEntries = timeEntries.map(entry => ({
      id: entry.id,
      userId: entry.userId,
      userName: entry.user.name,
      clockIn: entry.clockIn.toISOString(),
      clockOut: entry.clockOut?.toISOString(),
      breakStart: entry.breakStart?.toISOString(),
      breakEnd: entry.breakEnd?.toISOString(),
      totalHours: entry.totalHours,
      overtimeHours: entry.overtimeHours,
      status: entry.status,
      notes: entry.notes,
      approvedBy: entry.approvedBy,
      approvedAt: entry.approvedAt?.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedEntries)
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, notes } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    if (action === 'clockIn') {
      // Check if user already has an active time entry
      const activeEntry = await db.timeEntry.findFirst({
        where: {
          userId,
          status: 'active'
        }
      })

      if (activeEntry) {
        return NextResponse.json(
          { error: 'User is already clocked in' },
          { status: 400 }
        )
      }

      // Create new time entry
      const timeEntry = await db.timeEntry.create({
        data: {
          userId,
          clockIn: new Date(),
          status: 'active',
          notes: notes || null
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
        id: timeEntry.id,
        userId: timeEntry.userId,
        userName: timeEntry.user.name,
        clockIn: timeEntry.clockIn.toISOString(),
        status: timeEntry.status,
        notes: timeEntry.notes,
        createdAt: timeEntry.createdAt.toISOString()
      })

    } else if (action === 'clockOut') {
      // Find active time entry
      const activeEntry = await db.timeEntry.findFirst({
        where: {
          userId,
          status: 'active'
        }
      })

      if (!activeEntry) {
        return NextResponse.json(
          { error: 'No active time entry found' },
          { status: 400 }
        )
      }

      const clockOut = new Date()
      const clockIn = new Date(activeEntry.clockIn)
      
      // Calculate total hours
      const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
      
      // Calculate overtime (assuming 8 hours is regular time)
      const regularHours = Math.min(totalHours, 8)
      const overtimeHours = Math.max(totalHours - 8, 0)

      // Update time entry
      const updatedEntry = await db.timeEntry.update({
        where: { id: activeEntry.id },
        data: {
          clockOut,
          totalHours,
          overtimeHours,
          status: 'completed',
          updatedAt: new Date()
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
        id: updatedEntry.id,
        userId: updatedEntry.userId,
        userName: updatedEntry.user.name,
        clockIn: updatedEntry.clockIn.toISOString(),
        clockOut: updatedEntry.clockOut?.toISOString(),
        totalHours: updatedEntry.totalHours,
        overtimeHours: updatedEntry.overtimeHours,
        status: updatedEntry.status,
        notes: updatedEntry.notes,
        createdAt: updatedEntry.createdAt.toISOString(),
        updatedAt: updatedEntry.updatedAt.toISOString()
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "clockIn" or "clockOut"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error processing time entry:', error)
    return NextResponse.json(
      { error: 'Failed to process time entry' },
      { status: 500 }
    )
  }
}