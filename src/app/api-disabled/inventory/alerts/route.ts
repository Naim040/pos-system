import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (storeId) where.storeId = storeId;
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const [alerts, total] = await Promise.all([
      db.inventoryAlert.findMany({
        where,
        include: {
          product: {
            include: {
              category: true
            }
          },
          inventory: {
            include: {
              store: true
            }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      db.inventoryAlert.count({ where })
    ]);

    return NextResponse.json({
      alerts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      productId,
      inventoryId,
      storeId,
      type,
      severity,
      message
    } = body;

    // Validate required fields
    if (!productId || !inventoryId || !storeId || !type || !severity || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if inventory exists
    const inventory = await db.inventory.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }

    // Check if store exists
    const store = await db.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Create inventory alert
    const alert = await db.inventoryAlert.create({
      data: {
        productId,
        inventoryId,
        storeId,
        type,
        severity,
        message
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        inventory: {
          include: {
            store: true
          }
        }
      }
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory alert:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory alert' },
      { status: 500 }
    );
  }
}