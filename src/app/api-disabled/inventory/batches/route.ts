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
    const storeId = searchParams.get('storeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (storeId) {
      where.product = {
        inventory: {
          some: { storeId }
        }
      };
    }

    const [batches, total] = await Promise.all([
      db.batch.findMany({
        where,
        include: {
          product: {
            include: {
              category: true
            }
          },
          supplier: true,
          serialNumbers: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          inventoryItems: {
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
      db.batch.count({ where })
    ]);

    return NextResponse.json({
      batches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
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
      batchNumber,
      quantity,
      manufacturedDate,
      expiryDate,
      costPrice,
      supplierId,
      notes
    } = body;

    // Validate required fields
    if (!productId || !batchNumber || !quantity) {
      return NextResponse.json(
        { error: 'Product ID, batch number, and quantity are required' },
        { status: 400 }
      );
    }

    // Check if batch number already exists
    const existingBatch = await db.batch.findUnique({
      where: { batchNumber }
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch number already exists' },
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

    // Create batch
    const batch = await db.batch.create({
      data: {
        productId,
        batchNumber,
        quantity,
        manufacturedDate: manufacturedDate ? new Date(manufacturedDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        costPrice: costPrice || 0,
        supplierId,
        notes
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        supplier: true
      }
    });

    // Create stock movement record
    await db.stockMovement.create({
      data: {
        productId,
        storeId: 'default', // Will be updated when assigned to store
        type: 'in',
        quantity,
        reason: 'batch_creation',
        batchId: batch.id,
        notes: `Batch created: ${batchNumber}`
      }
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}