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
    const status = searchParams.get('status');
    const deliveryPersonId = searchParams.get('deliveryPersonId');
    const deliveryType = searchParams.get('deliveryType');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    if (storeId) where.storeId = storeId;
    if (status) where.deliveryStatus = status;
    if (deliveryPersonId) where.deliveryPersonId = deliveryPersonId;
    if (deliveryType) where.deliveryType = deliveryType;
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const deliveryOrders = await db.deliveryOrder.findMany({
      where,
      include: {
        sale: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            saleItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        deliveryPerson: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            status: true,
          },
        },
        deliveryArea: {
          select: {
            id: true,
            name: true,
            deliveryFee: true,
            estimatedTime: true,
          },
        },
        statusUpdates: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(deliveryOrders);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery orders' },
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

    const data = await request.json();
    const {
      saleId,
      storeId,
      deliveryAreaId,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryNotes,
      deliveryType,
      deliveryFee,
      estimatedDelivery,
      thirdPartyName,
      thirdPartyTrackingId,
    } = data;

    // Check if sale already has a delivery order
    const existingDelivery = await db.deliveryOrder.findUnique({
      where: { saleId },
    });

    if (existingDelivery) {
      return NextResponse.json(
        { error: 'Sale already has a delivery order' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const deliveryOrder = await db.deliveryOrder.create({
      data: {
        orderId,
        saleId,
        storeId,
        deliveryAreaId,
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        deliveryNotes,
        deliveryType,
        deliveryFee,
        estimatedDelivery,
        thirdPartyName,
        thirdPartyTrackingId,
      },
      include: {
        sale: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        deliveryArea: {
          select: {
            id: true,
            name: true,
            deliveryFee: true,
            estimatedTime: true,
          },
        },
      },
    });

    return NextResponse.json(deliveryOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery order:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery order' },
      { status: 500 }
    );
  }
}