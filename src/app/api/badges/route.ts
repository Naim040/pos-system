import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const badges = await db.badge.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(badges)
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, icon, color, backgroundColor, criteria, isActive } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Badge name is required' },
        { status: 400 }
      )
    }

    const badge = await db.badge.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        color: color || '#ffffff',
        backgroundColor: backgroundColor || '#ff6b6b',
        criteria: criteria || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(badge, { status: 201 })
  } catch (error) {
    console.error('Error creating badge:', error)
    return NextResponse.json(
      { error: 'Failed to create badge' },
      { status: 500 }
    )
  }
}