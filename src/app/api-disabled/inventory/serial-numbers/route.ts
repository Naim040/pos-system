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
    const productId = searchParams.get('productId');
    const batchId = searchParams.get('batchId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (batchId) where.batchId = batchId;
    if (status) where.status = status;

    const [serialNumbers, total] = await Promise.all([
      db.serialNumber.findMany({
        where,
        include: {
          product: {
            include: {
              category: true
            }
          },
          batch: true,
          sale: true,
          inventoryItem: {
            include: {
              inventory: {
                include: {
                  store: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      db.serialNumber.count({ where })
    ]);

    return NextResponse.json({
      serialNumbers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching serial numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch serial numbers' },
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
      batchId,
      serialNumber,
      costPrice,
      notes
    } = body;

    // Validate required fields
    if (!productId || !serialNumber) {
      return NextResponse.json(
        { error: 'Product ID and serial number are required' },
        { status: 400 }
      );
    }

    // Check if serial number already exists
    const existingSerial = await db.serialNumber.findUnique({
      where: { serialNumber }
    });

    if (existingSerial) {
      return NextResponse.json(
        { error: 'Serial number already exists' },
        { status: 400 }
      );
    }

    // Check if product exists and is serialized
    const product = await db.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.isSerialized) {
      return NextResponse.json(
        { error: 'Product is not configured for serial number tracking' },
        { status: 400 }
      );
    }

    // If batchId is provided, check if batch exists
    if (batchId) {
      const batch = await db.batch.findUnique({
        where: { id: batchId }
      });

      if (!batch) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
    }

    // Create serial number
    const newSerialNumber = await db.serialNumber.create({
      data: {
        productId,
        batchId,
        serialNumber,
        costPrice: costPrice || 0,
        notes
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        batch: true
      }
    });

    // Create stock movement record
    await db.stockMovement.create({
      data: {
        productId,
        storeId: 'default', // Will be updated when assigned to store
        type: 'in',
        quantity: 1,
        reason: 'serial_number_creation',
        serialNumberId: newSerialNumber.id,
        batchId,
        notes: `Serial number created: ${serialNumber}`
      }
    });

    return NextResponse.json(newSerialNumber, { status: 201 });
  } catch (error) {
    console.error('Error creating serial number:', error);
    return NextResponse.json(
      { error: 'Failed to create serial number' },
      { status: 500 }
    );
  }
}