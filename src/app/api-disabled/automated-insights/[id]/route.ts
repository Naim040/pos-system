import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params
    const insight = await db.automatedInsight.findUnique({
      where: { id: params.id },
      include: {
        insightTargets: true
      }
    })

    if (!insight) {
      return NextResponse.json(
        { error: 'Automated insight not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(insight)
  } catch (error) {
    console.error('Error fetching automated insight:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automated insight' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params
    const body = await request.json()
    
    const {
      isResolved,
      isRead,
      actionTaken
    } = body

    const updateData: any = {}
    
    if (isResolved !== undefined) {
      updateData.isResolved = isResolved
      if (isResolved) {
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = 'system' // In real app, get from authenticated user
      } else {
        updateData.resolvedAt = null
        updateData.resolvedBy = null
      }
    }
    
    if (isRead !== undefined) updateData.isRead = isRead
    if (actionTaken !== undefined) updateData.actionTaken = actionTaken

    const insight = await db.automatedInsight.update({
      where: { id: params.id },
      data: updateData,
      include: {
        insightTargets: true
      }
    })

    return NextResponse.json(insight)
  } catch (error) {
    console.error('Error updating automated insight:', error)
    return NextResponse.json(
      { error: 'Failed to update automated insight' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params
    // Delete insight targets first
    await db.insightTarget.deleteMany({
      where: { insightId: params.id }
    })

    // Delete insight
    await db.automatedInsight.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Automated insight deleted successfully' })
  } catch (error) {
    console.error('Error deleting automated insight:', error)
    return NextResponse.json(
      { error: 'Failed to delete automated insight' },
      { status: 500 }
    )
  }
}