import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PREDEFINED_PLATFORMS } from '@/types/ecommerce'

export async function GET() {
  try {
    // Get all stores with platform details
    const stores = await db.ecommerceStore.findMany({
      include: {
        platform: true,
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform stores to include additional details
    const storesWithDetails = stores.map(store => ({
      ...store,
      platformName: store.platform.name,
      productCount: store._count.products,
      orderCount: store._count.orders,
      lastSyncLog: null // Will be populated with latest sync log if needed
    }))

    return NextResponse.json(storesWithDetails)
  } catch (error) {
    console.error('Error fetching e-commerce stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch e-commerce stores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, platformId, storeUrl, apiKey, apiSecret, config } = body

    // Validate required fields
    if (!name || !platformId || !storeUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if platform exists
    const platform = await db.ecommercePlatform.findUnique({
      where: { id: platformId }
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Create the store
    const store = await db.ecommerceStore.create({
      data: {
        name,
        platformId,
        storeUrl,
        apiKey,
        apiSecret,
        config: JSON.stringify(config || {}),
        isActive: true,
        autoSync: true,
        syncInterval: 30
      },
      include: {
        platform: true
      }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error creating e-commerce store:', error)
    return NextResponse.json(
      { error: 'Failed to create e-commerce store' },
      { status: 500 }
    )
  }
}