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
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (storeId) where.storeId = storeId;
    if (isActive !== null) where.isActive = isActive === 'true';

    const [reorderRules, total] = await Promise.all([
      db.reorderRule.findMany({
        where,
        include: {
          product: {
            include: {
              category: true
            }
          },
          store: true,
          supplier: true,
          autoOrders: {
            take: 3,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      db.reorderRule.count({ where })
    ]);

    return NextResponse.json({
      reorderRules,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reorder rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reorder rules' },
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
      storeId,
      ruleType,
      triggerValue,
      orderQuantity,
      supplierId,
      priority,
      notes
    } = body;

    // Validate required fields
    if (!productId || !storeId || !ruleType || triggerValue === undefined || !orderQuantity) {
      return NextResponse.json(
        { error: 'Product ID, store ID, rule type, trigger value, and order quantity are required' },
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

    // If supplierId is provided, check if supplier exists
    if (supplierId) {
      const supplier = await db.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }
    }

    // Create reorder rule
    const reorderRule = await db.reorderRule.create({
      data: {
        productId,
        storeId,
        ruleType,
        triggerValue,
        orderQuantity,
        supplierId,
        priority: priority || 0,
        notes
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        store: true,
        supplier: true
      }
    });

    return NextResponse.json(reorderRule, { status: 201 });
  } catch (error) {
    console.error('Error creating reorder rule:', error);
    return NextResponse.json(
      { error: 'Failed to create reorder rule' },
      { status: 500 }
    );
  }
}