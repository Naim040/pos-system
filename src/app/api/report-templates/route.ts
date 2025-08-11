import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isDefault = searchParams.get('isDefault')

    const whereClause: any = {}
    if (category) whereClause.category = category
    if (isDefault !== null) whereClause.isDefault = isDefault === 'true'

    const templates = await db.reportTemplate.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching report templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report templates' },
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
      category,
      config,
      isDefault,
      isSystem
    } = body

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse JSON fields
    let parsedConfig = {}
    try {
      parsedConfig = config ? JSON.parse(config) : {}
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in config' },
        { status: 400 }
      )
    }

    // If this is set as default, remove default flag from other templates in the same category
    if (isDefault) {
      await db.reportTemplate.updateMany({
        where: { category, isDefault: true },
        data: { isDefault: false }
      })
    }

    const template = await db.reportTemplate.create({
      data: {
        name,
        description,
        category,
        config: JSON.stringify(parsedConfig),
        isDefault: isDefault || false,
        isSystem: isSystem || false,
        createdBy: 'system' // In real app, get from authenticated user
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating report template:', error)
    return NextResponse.json(
      { error: 'Failed to create report template' },
      { status: 500 }
    )
  }
}