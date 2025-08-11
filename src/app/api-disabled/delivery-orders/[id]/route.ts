import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { smsService } from '@/lib/smsService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deliveryOrder = await db.deliveryOrder.findUnique({
      where: { id: params.id },
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
                email: true,
              },
            },
            saleItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                  },
                },
              },
            },
            payments: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        deliveryPerson: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
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
        deliveryReports: true,
      },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { error: 'Delivery order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deliveryOrder);
  } catch (error) {
    console.error('Error fetching delivery order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery order' },
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
      deliveryPersonId,
      deliveryStatus,
      deliveryAddress,
      deliveryNotes,
      deliveryFee,
      estimatedDelivery,
      thirdPartyName,
      thirdPartyTrackingId,
      notes,
    } = data;

    // Get current delivery order
    const currentOrder = await db.deliveryOrder.findUnique({
      where: { id: params.id },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Delivery order not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...(deliveryPersonId !== undefined && { deliveryPersonId }),
      ...(deliveryStatus && { deliveryStatus }),
      ...(deliveryAddress && { deliveryAddress }),
      ...(deliveryNotes !== undefined && { deliveryNotes }),
      ...(deliveryFee !== undefined && { deliveryFee }),
      ...(estimatedDelivery !== undefined && { estimatedDelivery }),
      ...(thirdPartyName !== undefined && { thirdPartyName }),
      ...(thirdPartyTrackingId !== undefined && { thirdPartyTrackingId }),
      ...(notes !== undefined && { notes }),
    };

    // Update timestamps based on status
    const now = new Date();
    if (deliveryStatus === 'assigned' && !currentOrder.assignedAt) {
      updateData.assignedAt = now;
    }
    if (deliveryStatus === 'out_for_delivery' && !currentOrder.pickedUpAt) {
      updateData.pickedUpAt = now;
    }
    if (deliveryStatus === 'delivered' && !currentOrder.deliveredAt) {
      updateData.deliveredAt = now;
      updateData.actualDelivery = now;
    }
    if (deliveryStatus === 'cancelled' && !currentOrder.cancelledAt) {
      updateData.cancelledAt = now;
    }

    const deliveryOrder = await db.deliveryOrder.update({
      where: { id: params.id },
      data: updateData,
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
      },
    });

    // Create status update if status changed
    if (deliveryStatus && deliveryStatus !== currentOrder.deliveryStatus) {
      await db.deliveryStatusUpdate.create({
        data: {
          deliveryOrderId: params.id,
          status: deliveryStatus,
          notes: `Status updated to ${deliveryStatus}`,
          updatedBy: session.user.id,
        },
      });

      // Send SMS notification if customer has phone number
      try {
        if (deliveryOrder.sale?.customer?.phone) {
          await smsService.loadSettings();
          
          // Map delivery status to SMS status type
          let smsStatus: 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled' = 'out_for_delivery';
          
          switch (deliveryStatus) {
            case 'out_for_delivery':
              smsStatus = 'out_for_delivery';
              break;
            case 'delivered':
              smsStatus = 'delivered';
              break;
            case 'failed':
              smsStatus = 'failed';
              break;
            case 'cancelled':
              smsStatus = 'cancelled';
              break;
            default:
              // Don't send SMS for other status changes
              return NextResponse.json(deliveryOrder);
          }

          await smsService.sendDeliveryUpdateSMS(deliveryOrder.sale.customer.phone, {
            orderId: params.id,
            status: smsStatus,
            estimatedTime: estimatedDelivery || deliveryOrder.estimatedDelivery?.toISOString(),
            trackingUrl: thirdPartyTrackingId || deliveryOrder.thirdPartyTrackingId,
            storeName: deliveryOrder.store?.name || 'POS System'
          });
        }
      } catch (smsError) {
        console.error('Error sending delivery status SMS:', smsError);
        // Don't fail the delivery update if SMS fails
      }
    }

    return NextResponse.json(deliveryOrder);
  } catch (error) {
    console.error('Error updating delivery order:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery order' },
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

    const deliveryOrder = await db.deliveryOrder.findUnique({
      where: { id: params.id },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { error: 'Delivery order not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending orders
    if (deliveryOrder.deliveryStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete delivery order that is already in progress' },
        { status: 400 }
      );
    }

    await db.deliveryOrder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Delivery order deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery order:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery order' },
      { status: 500 }
    );
  }
}