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

    const serialNumber = await db.serialNumber.findUnique({
      where: { id: params.id },
      include: {
        product: {
          include: {
            category: true
          }
        },
        batch: true,
        sale: {
          include: {
            customer: true,
            store: true
          }
        },
        inventoryItem: {
          include: {
            inventory: {
              include: {
                store: true
              }
            }
          }
        },
        stockMovements: {
          include: {
            store: true,
            user: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!serialNumber) {
      return NextResponse.json(
        { error: 'Serial number not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serialNumber);
  } catch (error) {
    console.error('Error fetching serial number:', error);
    return NextResponse.json(
      { error: 'Failed to fetch serial number' },
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

    const body = await request.json();
    const {
      serialNumber,
      status,
      costPrice,
      notes
    } = body;

    const existingSerial = await db.serialNumber.findUnique({
      where: { id: params.id }
    });

    if (!existingSerial) {
      return NextResponse.json(
        { error: 'Serial number not found' },
        { status: 404 }
      );
    }

    // Check if serial number is being changed and already exists
    if (serialNumber && serialNumber !== existingSerial.serialNumber) {
      const duplicateSerial = await db.serialNumber.findUnique({
        where: { serialNumber }
      });

      if (duplicateSerial) {
        return NextResponse.json(
          { error: 'Serial number already exists' },
          { status: 400 }
        );
      }
    }

    const updatedSerialNumber = await db.serialNumber.update({
      where: { id: params.id },
      data: {
        serialNumber: serialNumber || existingSerial.serialNumber,
        status: status || existingSerial.status,
        costPrice: costPrice || existingSerial.costPrice,
        notes
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        batch: true,
        sale: true
      }
    });

    return NextResponse.json(updatedSerialNumber);
  } catch (error) {
    console.error('Error updating serial number:', error);
    return NextResponse.json(
      { error: 'Failed to update serial number' },
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

    const serialNumber = await db.serialNumber.findUnique({
      where: { id: params.id },
      include: {
        sale: true,
        inventoryItem: true
      }
    });

    if (!serialNumber) {
      return NextResponse.json(
        { error: 'Serial number not found' },
        { status: 404 }
      );
    }

    // Check if serial number is associated with a sale or inventory item
    if (serialNumber.sale || serialNumber.inventoryItem) {
      return NextResponse.json(
        { error: 'Cannot delete serial number that is associated with a sale or inventory item' },
        { status: 400 }
      );
    }

    await db.serialNumber.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Serial number deleted successfully' });
  } catch (error) {
    console.error('Error deleting serial number:', error);
    return NextResponse.json(
      { error: 'Failed to delete serial number' },
      { status: 500 }
    );
  }
}