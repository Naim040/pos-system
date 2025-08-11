import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportInstanceId = searchParams.get('reportInstanceId')
    const type = searchParams.get('type')
    const isRead = searchParams.get('isRead')
    const isResolved = searchParams.get('isResolved')

    const whereClause: any = {}
    if (reportInstanceId) whereClause.reportInstanceId = reportInstanceId
    if (type) whereClause.type = type
    if (isRead !== null) whereClause.isRead = isRead === 'true'
    if (isResolved !== null) whereClause.isResolved = isResolved === 'true'

    const insights = await db.reportInsight.findMany({
      where: whereClause,
      include: {
        reportInstance: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            template: {
              select: {
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Error fetching report insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report insights' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      reportInstanceId,
      type,
      title,
      description,
      confidence,
      impact,
      action,
      metadata
    } = body

    // Validate required fields
    if (!reportInstanceId || !type || !title || !description || !confidence || !impact) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if report instance exists
    const reportInstance = await db.reportInstance.findUnique({
      where: { id: reportInstanceId }
    })

    if (!reportInstance) {
      return NextResponse.json(
        { error: 'Report instance not found' },
        { status: 404 }
      )
    }

    const insight = await db.reportInsight.create({
      data: {
        reportInstanceId,
        type,
        title,
        description,
        confidence,
        impact,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null
      },
      include: {
        reportInstance: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json(insight)
  } catch (error) {
    console.error('Error creating report insight:', error)
    return NextResponse.json(
      { error: 'Failed to create report insight' },
      { status: 500 }
    )
  }
}