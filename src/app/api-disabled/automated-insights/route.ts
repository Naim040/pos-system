import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const isResolved = searchParams.get('isResolved')
    const isRead = searchParams.get('isRead')

    const whereClause: any = {}
    if (category) whereClause.category = category
    if (type) whereClause.type = type
    if (severity) whereClause.severity = severity
    if (isResolved !== null) whereClause.isResolved = isResolved === 'true'
    if (isRead !== null) whereClause.isRead = isRead === 'true'

    const insights = await db.automatedInsight.findMany({
      where: whereClause,
      include: {
        insightTargets: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Error fetching automated insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automated insights' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      type,
      category,
      title,
      description,
      data,
      severity,
      confidence,
      insightTargets
    } = body

    // Validate required fields
    if (!type || !category || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse JSON fields
    let parsedData = {}
    try {
      parsedData = data ? JSON.parse(data) : {}
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in data' },
        { status: 400 }
      )
    }

    const insight = await db.automatedInsight.create({
      data: {
        type,
        category,
        title,
        description,
        data: JSON.stringify(parsedData),
        severity: severity || 'medium',
        confidence: confidence || 0.8,
        insightTargets: {
          create: insightTargets?.map((target: any) => ({
            targetType: target.targetType,
            targetId: target.targetId,
            metadata: target.metadata ? JSON.stringify(target.metadata) : null
          })) || []
        }
      },
      include: {
        insightTargets: true
      }
    })

    return NextResponse.json(insight)
  } catch (error) {
    console.error('Error creating automated insight:', error)
    return NextResponse.json(
      { error: 'Failed to create automated insight' },
      { status: 500 }
    )
  }
}