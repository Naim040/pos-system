import { Server } from 'socket.io';
import { db } from '@/lib/db';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join rooms for real-time updates
    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    // Leave rooms
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    // Handle inventory updates
    socket.on('inventory-update', async (data: { productId: string; quantity: number }) => {
      try {
        await db.inventory.update({
          where: { productId: data.productId },
          data: { quantity: data.quantity }
        });
        
        // Broadcast inventory update to all clients in inventory room
        io.to('inventory').emit('inventory-updated', {
          productId: data.productId,
          quantity: data.quantity,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Inventory update error:', error);
        socket.emit('error', { message: 'Failed to update inventory' });
      }
    });

    // Handle new sales
    socket.on('new-sale', async (saleData: any) => {
      try {
        // Broadcast new sale to all clients in sales room
        io.to('sales').emit('sale-created', {
          ...saleData,
          timestamp: new Date().toISOString()
        });

        // If sale has customer, broadcast customer update
        if (saleData.customerId) {
          const customer = await db.customer.findUnique({
            where: { id: saleData.customerId }
          });
          
          if (customer) {
            io.to('customers').emit('customer-updated', {
              customerId: saleData.customerId,
              loyaltyPoints: customer.loyaltyPoints,
              loyaltyTier: customer.loyaltyTier,
              totalSpent: customer.totalSpent,
              visitCount: customer.visitCount,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Sale broadcast error:', error);
      }
    });

    // Handle customer updates
    socket.on('customer-update', async (data: { customerId: string; updates: any }) => {
      try {
        await db.customer.update({
          where: { id: data.customerId },
          data: data.updates
        });
        
        // Broadcast customer update to all clients in customers room
        io.to('customers').emit('customer-updated', {
          customerId: data.customerId,
          ...data.updates,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Customer update error:', error);
        socket.emit('error', { message: 'Failed to update customer' });
      }
    });

    // Handle product updates
    socket.on('product-update', async (data: { productId: string; updates: any }) => {
      try {
        await db.product.update({
          where: { id: data.productId },
          data: data.updates
        });
        
        // Broadcast product update to all clients in products room
        io.to('products').emit('product-updated', {
          productId: data.productId,
          ...data.updates,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Product update error:', error);
        socket.emit('error', { message: 'Failed to update product' });
      }
    });

    // Real-time inventory alerts
    socket.on('check-low-stock', async () => {
      try {
        const lowStockItems = await db.inventory.findMany({
          where: {
            quantity: {
              lte: db.inventory.fields.minStock
            }
          },
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        });

        if (lowStockItems.length > 0) {
          io.to('inventory').emit('low-stock-alert', {
            items: lowStockItems,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Low stock check error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message with available rooms
    socket.emit('connected', {
      message: 'Connected to POS Real-time Server',
      rooms: ['inventory', 'sales', 'customers', 'products'],
      timestamp: new Date().toISOString()
    });
  });
};