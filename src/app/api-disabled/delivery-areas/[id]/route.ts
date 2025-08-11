import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deliveryArea = await db.deliveryArea.findUnique({
      where: { id: params.id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        deliveries: {
          include: {
            sale: {
              select: {
                id: true,
                totalAmount: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!deliveryArea) {
      return NextResponse.json(
        { error: 'Delivery area not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deliveryArea);
  } catch (error) {
    console.error('Error fetching delivery area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery area' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      description,
      areaCode,
      boundaries,
      deliveryFee,
      minOrder,
      estimatedTime,
      isActive,
    } = data;

    const deliveryArea = await db.deliveryArea.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(areaCode !== undefined && { areaCode }),
        ...(boundaries !== undefined && { boundaries }),
        ...(deliveryFee !== undefined && { deliveryFee }),
        ...(minOrder !== undefined && { minOrder }),
        ...(estimatedTime !== undefined && { estimatedTime }),
        ...(isActive !== undefined && { isActive }),
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

    return NextResponse.json(deliveryArea);
  } catch (error) {
    console.error('Error updating delivery area:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery area' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if delivery area has active deliveries
    const activeDeliveries = await db.deliveryOrder.findMany({
      where: {
        deliveryAreaId: params.id,
        deliveryStatus: {
          in: ['pending', 'assigned', 'out_for_delivery'],
        },
      },
    });

    if (activeDeliveries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete delivery area with active deliveries' },
        { status: 400 }
      );
    }

    await db.deliveryArea.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Delivery area deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery area:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery area' },
      { status: 500 }
    );
  }
}