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

    const deliveryPerson = await db.deliveryPerson.findUnique({
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

    if (!deliveryPerson) {
      return NextResponse.json(
        { error: 'Delivery person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deliveryPerson);
  } catch (error) {
    console.error('Error fetching delivery person:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery person' },
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
      phone,
      email,
      address,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      status,
      notes,
    } = data;

    // Check if phone already exists for different person
    if (phone) {
      const existingPerson = await db.deliveryPerson.findFirst({
        where: {
          phone,
          NOT: { id: params.id },
        },
      });

      if (existingPerson) {
        return NextResponse.json(
          { error: 'Phone number already exists' },
          { status: 400 }
        );
      }
    }

    const deliveryPerson = await db.deliveryPerson.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(vehicleType && { vehicleType }),
        ...(vehicleNumber !== undefined && { vehicleNumber }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
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

    return NextResponse.json(deliveryPerson);
  } catch (error) {
    console.error('Error updating delivery person:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery person' },
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

    // Check if delivery person has active deliveries
    const activeDeliveries = await db.deliveryOrder.findMany({
      where: {
        deliveryPersonId: params.id,
        deliveryStatus: {
          in: ['assigned', 'out_for_delivery'],
        },
      },
    });

    if (activeDeliveries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete delivery person with active deliveries' },
        { status: 400 }
      );
    }

    await db.deliveryPerson.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Delivery person deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery person:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery person' },
      { status: 500 }
    );
  }
}