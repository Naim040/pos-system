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

    const reviews = await db.performanceReview.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        reviewDate: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Format the response
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      userId: review.userId,
      userName: review.user.name,
      reviewerId: review.reviewerId,
      reviewerName: review.reviewer.name,
      reviewDate: review.reviewDate.toISOString(),
      period: review.period,
      rating: review.rating,
      productivityRating: review.productivityRating,
      customerServiceRating: review.customerServiceRating,
      teamworkRating: review.teamworkRating,
      reliabilityRating: review.reliabilityRating,
      strengths: review.strengths,
      improvements: review.improvements,
      goals: review.goals,
      comments: review.comments,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedReviews)
  } catch (error) {
    console.error('Error fetching performance reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const review = await db.performanceReview.create({
      data: {
        userId: body.userId,
        reviewerId: body.reviewerId,
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : new Date(),
        period: body.period,
        rating: body.rating,
        productivityRating: body.productivityRating,
        customerServiceRating: body.customerServiceRating,
        teamworkRating: body.teamworkRating,
        reliabilityRating: body.reliabilityRating,
        strengths: body.strengths,
        improvements: body.improvements,
        goals: body.goals,
        comments: body.comments,
        status: body.status || 'draft'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      id: review.id,
      userId: review.userId,
      userName: review.user.name,
      reviewerId: review.reviewerId,
      reviewerName: review.reviewer.name,
      reviewDate: review.reviewDate.toISOString(),
      period: review.period,
      rating: review.rating,
      productivityRating: review.productivityRating,
      customerServiceRating: review.customerServiceRating,
      teamworkRating: review.teamworkRating,
      reliabilityRating: review.reliabilityRating,
      strengths: review.strengths,
      improvements: review.improvements,
      goals: review.goals,
      comments: review.comments,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating performance review:', error)
    return NextResponse.json(
      { error: 'Failed to create performance review' },
      { status: 500 }
    )
  }
}