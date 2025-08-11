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

    const reorderRule = await db.reorderRule.findUnique({
      where: { id: params.id },
      include: {
        product: {
          include: {
            category: true
          }
        },
        store: true,
        supplier: true,
        autoOrders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!reorderRule) {
      return NextResponse.json(
        { error: 'Reorder rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reorderRule);
  } catch (error) {
    console.error('Error fetching reorder rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reorder rule' },
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
      ruleType,
      triggerValue,
      orderQuantity,
      supplierId,
      isActive,
      priority,
      notes
    } = body;

    const existingRule = await db.reorderRule.findUnique({
      where: { id: params.id }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Reorder rule not found' },
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

    const updatedReorderRule = await db.reorderRule.update({
      where: { id: params.id },
      data: {
        ruleType: ruleType || existingRule.ruleType,
        triggerValue: triggerValue !== undefined ? triggerValue : existingRule.triggerValue,
        orderQuantity: orderQuantity || existingRule.orderQuantity,
        supplierId,
        isActive: isActive !== undefined ? isActive : existingRule.isActive,
        priority: priority !== undefined ? priority : existingRule.priority,
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

    return NextResponse.json(updatedReorderRule);
  } catch (error) {
    console.error('Error updating reorder rule:', error);
    return NextResponse.json(
      { error: 'Failed to update reorder rule' },
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

    const reorderRule = await db.reorderRule.findUnique({
      where: { id: params.id },
      include: {
        autoOrders: true
      }
    });

    if (!reorderRule) {
      return NextResponse.json(
        { error: 'Reorder rule not found' },
        { status: 404 }
      );
    }

    // Check if rule has active auto orders
    if (reorderRule.autoOrders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete reorder rule with active auto orders' },
        { status: 400 }
      );
    }

    await db.reorderRule.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Reorder rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting reorder rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete reorder rule' },
      { status: 500 }
    );
  }
}