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
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (storeId) where.storeId = storeId;
    if (isActive !== null) where.isActive = isActive === 'true';

    const deliveryAreas = await db.deliveryArea.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        deliveries: {
          select: {
            id: true,
            deliveryStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(deliveryAreas);
  } catch (error) {
    console.error('Error fetching delivery areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery areas' },
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
      name,
      description,
      storeId,
      areaCode,
      boundaries,
      deliveryFee,
      minOrder,
      estimatedTime,
      isActive,
    } = data;

    const deliveryArea = await db.deliveryArea.create({
      data: {
        name,
        description,
        storeId,
        areaCode,
        boundaries,
        deliveryFee,
        minOrder,
        estimatedTime,
        isActive,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(deliveryArea, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery area:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery area' },
      { status: 500 }
    );
  }
}