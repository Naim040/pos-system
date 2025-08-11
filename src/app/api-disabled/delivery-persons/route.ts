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

    const where: any = {};
    if (storeId) where.storeId = storeId;
    if (status) where.status = status;

    const deliveryPersons = await db.deliveryPerson.findMany({
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json(deliveryPersons);
  } catch (error) {
    console.error('Error fetching delivery persons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery persons' },
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
      phone,
      email,
      address,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      storeId,
      notes,
    } = data;

    // Check if phone already exists
    const existingPerson = await db.deliveryPerson.findUnique({
      where: { phone },
    });

    if (existingPerson) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 400 }
      );
    }

    const deliveryPerson = await db.deliveryPerson.create({
      data: {
        name,
        phone,
        email,
        address,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        storeId,
        notes,
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

    return NextResponse.json(deliveryPerson, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery person:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery person' },
      { status: 500 }
    );
  }
}