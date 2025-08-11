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

    const statusUpdates = await db.deliveryStatusUpdate.findMany({
      where: { deliveryOrderId: params.id },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(statusUpdates);
  } catch (error) {
    console.error('Error fetching delivery status updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery status updates' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { status, notes, location } = data;

    // Check if delivery order exists
    const deliveryOrder = await db.deliveryOrder.findUnique({
      where: { id: params.id },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { error: 'Delivery order not found' },
        { status: 404 }
      );
    }

    const statusUpdate = await db.deliveryStatusUpdate.create({
      data: {
        deliveryOrderId: params.id,
        status,
        notes,
        location,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(statusUpdate, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery status update:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery status update' },
      { status: 500 }
    );
  }
}