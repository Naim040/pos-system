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
    const reportType = searchParams.get('reportType') || 'daily';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const deliveryPersonId = searchParams.get('deliveryPersonId');

    const where: any = {};
    if (storeId) where.storeId = storeId;
    if (deliveryPersonId) where.deliveryPersonId = deliveryPersonId;
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Get delivery orders
    const deliveryOrders = await db.deliveryOrder.findMany({
      where,
      include: {
        sale: {
          select: {
            totalAmount: true,
            taxAmount: true,
            discount: true,
            createdAt: true,
          },
        },
        deliveryPerson: {
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate metrics based on report type
    const metrics = calculateDeliveryMetrics(deliveryOrders, reportType);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error generating delivery report:', error);
    return NextResponse.json(
      { error: 'Failed to generate delivery report' },
      { status: 500 }
    );
  }
}

function calculateDeliveryMetrics(deliveryOrders: any[], reportType: string) {
  const totalOrders = deliveryOrders.length;
  const deliveredOrders = deliveryOrders.filter(order => order.deliveryStatus === 'delivered');
  const pendingOrders = deliveryOrders.filter(order => order.deliveryStatus === 'pending');
  const assignedOrders = deliveryOrders.filter(order => order.deliveryStatus === 'assigned');
  const outForDeliveryOrders = deliveryOrders.filter(order => order.deliveryStatus === 'out_for_delivery');
  const cancelledOrders = deliveryOrders.filter(order => order.deliveryStatus === 'cancelled');
  const failedOrders = deliveryOrders.filter(order => order.deliveryStatus === 'failed');

  const totalDeliveryFees = deliveryOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
  const totalSalesAmount = deliveryOrders.reduce((sum, order) => sum + order.sale.totalAmount, 0);
  const averageDeliveryTime = calculateAverageDeliveryTime(deliveredOrders);
  const onTimeDeliveries = calculateOnTimeDeliveries(deliveredOrders);

  // Group by delivery person
  const deliveryPersonStats = deliveryOrders.reduce((acc, order) => {
    const personName = order.deliveryPerson?.name || 'Unassigned';
    if (!acc[personName]) {
      acc[personName] = {
        name: personName,
        totalOrders: 0,
        deliveredOrders: 0,
        totalDeliveryFees: 0,
        averageDeliveryTime: 0,
      };
    }
    acc[personName].totalOrders++;
    if (order.deliveryStatus === 'delivered') {
      acc[personName].deliveredOrders++;
    }
    acc[personName].totalDeliveryFees += order.deliveryFee;
    return acc;
  }, {});

  // Calculate average delivery time per person
  Object.keys(deliveryPersonStats).forEach(personName => {
    const personOrders = deliveredOrders.filter(order => 
      order.deliveryPerson?.name === personName
    );
    deliveryPersonStats[personName].averageDeliveryTime = calculateAverageDeliveryTime(personOrders);
  });

  // Group by delivery area
  const deliveryAreaStats = deliveryOrders.reduce((acc, order) => {
    const areaName = order.deliveryArea?.name || 'Unknown';
    if (!acc[areaName]) {
      acc[areaName] = {
        name: areaName,
        totalOrders: 0,
        deliveredOrders: 0,
        totalDeliveryFees: 0,
        averageDeliveryFee: 0,
      };
    }
    acc[areaName].totalOrders++;
    if (order.deliveryStatus === 'delivered') {
      acc[areaName].deliveredOrders++;
    }
    acc[areaName].totalDeliveryFees += order.deliveryFee;
    return acc;
  }, {});

  // Calculate average delivery fee per area
  Object.keys(deliveryAreaStats).forEach(areaName => {
    const areaOrders = deliveryOrders.filter(order => 
      order.deliveryArea?.name === areaName
    );
    if (areaOrders.length > 0) {
      deliveryAreaStats[areaName].averageDeliveryFee = 
        deliveryAreaStats[areaName].totalDeliveryFees / areaOrders.length;
    }
  });

  return {
    reportType,
    period: {
      from: deliveryOrders.length > 0 ? deliveryOrders[0].createdAt : null,
      to: deliveryOrders.length > 0 ? deliveryOrders[deliveryOrders.length - 1].createdAt : null,
    },
    summary: {
      totalOrders,
      deliveredOrders: deliveredOrders.length,
      pendingOrders: pendingOrders.length,
      assignedOrders: assignedOrders.length,
      outForDeliveryOrders: outForDeliveryOrders.length,
      cancelledOrders: cancelledOrders.length,
      failedOrders: failedOrders.length,
      successRate: totalOrders > 0 ? (deliveredOrders.length / totalOrders) * 100 : 0,
      totalDeliveryFees,
      totalSalesAmount,
      averageDeliveryTime,
      onTimeDeliveryRate: deliveredOrders.length > 0 ? (onTimeDeliveries / deliveredOrders.length) * 100 : 0,
    },
    deliveryPersonStats: Object.values(deliveryPersonStats),
    deliveryAreaStats: Object.values(deliveryAreaStats),
    recentOrders: deliveryOrders.slice(0, 10).map(order => ({
      id: order.id,
      orderId: order.orderId,
      customerName: order.customerName,
      deliveryStatus: order.deliveryStatus,
      deliveryFee: order.deliveryFee,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      deliveryPerson: order.deliveryPerson?.name,
    })),
  };
}

function calculateAverageDeliveryTime(deliveredOrders: any[]): number {
  if (deliveredOrders.length === 0) return 0;
  
  const totalMinutes = deliveredOrders.reduce((sum, order) => {
    if (order.createdAt && order.deliveredAt) {
      const diff = new Date(order.deliveredAt).getTime() - new Date(order.createdAt).getTime();
      return sum + Math.floor(diff / (1000 * 60)); // Convert to minutes
    }
    return sum;
  }, 0);

  return Math.floor(totalMinutes / deliveredOrders.length);
}

function calculateOnTimeDeliveries(deliveredOrders: any[]): number {
  if (deliveredOrders.length === 0) return 0;
  
  return deliveredOrders.reduce((count, order) => {
    if (order.estimatedDelivery && order.deliveredAt) {
      const estimated = new Date(order.estimatedDelivery).getTime();
      const actual = new Date(order.deliveredAt).getTime();
      if (actual <= estimated) {
        return count + 1;
      }
    }
    return count;
  }, 0);
}