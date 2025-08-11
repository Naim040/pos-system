import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tabs = await db.globalTab.findMany({
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(tabs)
  } catch (error) {
    console.error('Error fetching tabs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tabs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, icon, order, targetUrl, isActive } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Tab name is required' },
        { status: 400 }
      )
    }

    const tab = await db.globalTab.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        order: order || 0,
        targetUrl: targetUrl || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(tab, { status: 201 })
  } catch (error) {
    console.error('Error creating tab:', error)
    return NextResponse.json(
      { error: 'Failed to create tab' },
      { status: 500 }
    )
  }
}