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

    const batch = await db.batch.findUnique({
      where: { id: params.id },
      include: {
        product: {
          include: {
            category: true
          }
        },
        supplier: true,
        serialNumbers: {
          include: {
            sale: true
          },
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

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
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
      batchNumber,
      quantity,
      manufacturedDate,
      expiryDate,
      costPrice,
      supplierId,
      notes,
      isActive
    } = body;

    const existingBatch = await db.batch.findUnique({
      where: { id: params.id }
    });

    if (!existingBatch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if batch number is being changed and already exists
    if (batchNumber && batchNumber !== existingBatch.batchNumber) {
      const duplicateBatch = await db.batch.findUnique({
        where: { batchNumber }
      });

      if (duplicateBatch) {
        return NextResponse.json(
          { error: 'Batch number already exists' },
          { status: 400 }
        );
      }
    }

    const updatedBatch = await db.batch.update({
      where: { id: params.id },
      data: {
        batchNumber: batchNumber || existingBatch.batchNumber,
        quantity: quantity || existingBatch.quantity,
        manufacturedDate: manufacturedDate ? new Date(manufacturedDate) : existingBatch.manufacturedDate,
        expiryDate: expiryDate ? new Date(expiryDate) : existingBatch.expiryDate,
        costPrice: costPrice || existingBatch.costPrice,
        supplierId,
        notes,
        isActive: isActive !== undefined ? isActive : existingBatch.isActive
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

    return NextResponse.json(updatedBatch);
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { error: 'Failed to update batch' },
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

    const batch = await db.batch.findUnique({
      where: { id: params.id },
      include: {
        serialNumbers: true,
        inventoryItems: true
      }
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if batch has active serial numbers or inventory items
    if (batch.serialNumbers.length > 0 || batch.inventoryItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete batch with active serial numbers or inventory items' },
        { status: 400 }
      );
    }

    await db.batch.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      { error: 'Failed to delete batch' },
      { status: 500 }
    );
  }
}