import { FastifyInstance } from 'fastify';
import { db, orders, orderItems, products, customers, activityLogs } from '../db/index.js';
import { eq, and, desc, sql, asc, gte } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';

// Validation schemas
const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']).optional(),
  fulfillmentStatus: z.enum(['unfulfilled', 'partial', 'fulfilled']).optional(),
  adminNotes: z.string().max(1000).optional(),
});

const trackingSchema = z.object({
  carrier: z.string().min(1).max(200),
  trackingNumber: z.string().min(1).max(100),
});

export default async function orderRoutes(fastify: FastifyInstance) {
  // ========== PUBLIC/CUSTOMER ROUTES ==========

  // Get customer orders
  fastify.get('/customer', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const user = request.user as { customerId: string };
    const customerId = user.customerId;
    const { page = '1', limit = '10' } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      const ordersList = await db.select()
        .from(orders)
        .where(eq(orders.customerId, customerId))
        .orderBy(desc(orders.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get items for each order
      const ordersWithItems = await Promise.all(
        ordersList.map(async (order) => {
          const items = await db.select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          return { ...order, items };
        })
      );

      const totalCount = await db.select({ count: sql`count(*)` })
        .from(orders)
        .where(eq(orders.customerId, customerId));

      return reply.send({
        data: ordersWithItems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / Number(limit)),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch orders' });
    }
  });

  // Get customer order by ID
  fastify.get('/customer/:orderId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const user = request.user as { customerId: string };

    try {
      const orderArr = await db.select()
        .from(orders)
        .where(and(
          eq(orders.id, orderId),
          eq(orders.customerId, user.customerId)
        ))
        .limit(1);

      if (orderArr.length === 0) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      return reply.send({
        data: { ...orderArr[0], items },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch order' });
    }
  });

  // ========== ADMIN ROUTES ==========

  // Get all orders for store
  fastify.get('/admin', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const storeId = user.storeId;
    const {
      page = '1',
      limit = '20',
      status,
      paymentStatus,
      search,
      startDate,
      endDate,
    } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(orders).where(eq(orders.storeId, storeId));

      // Filters
      if (status) {
        query = db.select().from(orders).where(
          and(eq(orders.storeId, storeId), eq(orders.status, status))
        );
      }

      if (paymentStatus) {
        query = db.select().from(orders).where(
          and(eq(orders.storeId, storeId), eq(orders.paymentStatus, paymentStatus))
        );
      }

      const ordersList = await query
        .orderBy(desc(orders.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get customer names (excluding password hash)
      const ordersWithCustomers = await Promise.all(
        ordersList.map(async (order) => {
          let customerName = 'Guest';
          if (order.customerId) {
            const customer = await db.select({
              firstName: customers.firstName,
              lastName: customers.lastName,
            })
              .from(customers)
              .where(eq(customers.id, order.customerId))
              .limit(1);
            if (customer.length > 0) {
              customerName = `${customer[0].firstName} ${customer[0].lastName}`;
            }
          }
          return { ...order, customerName };
        })
      );

      const totalCount = await db.select({ count: sql`count(*)` })
        .from(orders)
        .where(eq(orders.storeId, storeId));

      return reply.send({
        data: ordersWithCustomers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / Number(limit)),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch orders' });
    }
  });

  // Get recent orders (for activity feed)
  fastify.get('/admin/recent', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const { limit = '5' } = request.query as any;

    try {
      const recentOrders = await db.select()
        .from(orders)
        .where(eq(orders.storeId, user.storeId))
        .orderBy(desc(orders.createdAt))
        .limit(Number(limit));

      // Get customer names (excluding password hash)
      const ordersWithCustomers = await Promise.all(
        recentOrders.map(async (order) => {
          let customerName = 'Guest';
          if (order.customerId) {
            const customer = await db.select({
              firstName: customers.firstName,
              lastName: customers.lastName,
            })
              .from(customers)
              .where(eq(customers.id, order.customerId))
              .limit(1);
            if (customer.length > 0) {
              customerName = `${customer[0].firstName} ${customer[0].lastName}`;
            }
          }
          return {
            ...order,
            customerName,
            orderNumber: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
          };
        })
      );

      return reply.send({
        data: ordersWithCustomers,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch recent orders' });
    }
  });

  // Get order details (admin)
  fastify.get('/admin/:orderId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const user = request.user as { storeId: string };

    try {
      const orderArr = await db.select()
        .from(orders)
        .where(and(
          eq(orders.id, orderId),
          eq(orders.storeId, user.storeId)
        ))
        .limit(1);

      if (orderArr.length === 0) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Get customer info (excluding password hash)
      let customer = null;
      if (orderArr[0].customerId) {
        const customerArr = await db.select({
          id: customers.id,
          email: customers.email,
          firstName: customers.firstName,
          lastName: customers.lastName,
          phone: customers.phone,
          avatarUrl: customers.avatarUrl,
          isVerified: customers.isVerified,
          storeId: customers.storeId,
          lastLoginAt: customers.lastLoginAt,
          createdAt: customers.createdAt,
        })
          .from(customers)
          .where(eq(customers.id, orderArr[0].customerId))
          .limit(1);
        if (customerArr.length > 0) {
          customer = customerArr[0];
        }
      }

      return reply.send({
        data: {
          ...orderArr[0],
          items,
          customer,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch order' });
    }
  });

  // Update order status
  fastify.put('/admin/:orderId/status', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const parsed = orderStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid status data', details: parsed.error.format() });
    }
    const { status, paymentStatus, fulfillmentStatus, adminNotes } = parsed.data;
    const user = request.user as { storeId: string; userId: string };

    try {
      const orderArr = await db.select()
        .from(orders)
        .where(and(
          eq(orders.id, orderId),
          eq(orders.storeId, user.storeId)
        ))
        .limit(1);

      if (orderArr.length === 0) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const updateData: any = { updatedAt: new Date() };

      if (status) {
        updateData.status = status;

        // Set timestamps based on status
        if (status === 'shipped') {
          updateData.shippedAt = new Date();
        } else if (status === 'delivered') {
          updateData.deliveredAt = new Date();
        }
      }

      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (fulfillmentStatus) updateData.fulfillmentStatus = fulfillmentStatus;
      if (adminNotes) updateData.adminNotes = adminNotes;

      await db.update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId));

      // Log activity
      await db.insert(activityLogs).values({
        storeId: user.storeId,
        userId: user.userId,
        entityType: 'order',
        entityId: orderId,
        action: 'updated',
        metadata: { status, paymentStatus, fulfillmentStatus },
      });

      return reply.send({ message: 'Order updated successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update order' });
    }
  });

  // Update tracking info
  fastify.put('/admin/:orderId/tracking', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const parsed = trackingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid tracking data', details: parsed.error.format() });
    }
    const { carrier, trackingNumber } = parsed.data;
    const user = request.user as { storeId: string };

    try {
      await db.update(orders)
        .set({
          shippingCarrier: carrier,
          trackingNumber,
          status: 'shipped',
          fulfillmentStatus: 'fulfilled',
          shippedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(orders.id, orderId),
          eq(orders.storeId, user.storeId)
        ));

      return reply.send({ message: 'Tracking info updated' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update tracking' });
    }
  });

  // Get order statistics
  fastify.get('/admin/stats', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const { period = 'today' } = request.query as any;

    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'today':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      const stats = await db.select({
        totalOrders: sql<number>`cast(count(*) as integer)`,
        revenue: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total}::numeric ELSE 0 END), 0)::text`,
        pendingOrders: sql<number>`cast(count(CASE WHEN ${orders.status} = 'pending' THEN 1 END) as integer)`,
        processingOrders: sql<number>`cast(count(CASE WHEN ${orders.status} = 'processing' THEN 1 END) as integer)`,
        shippedOrders: sql<number>`cast(count(CASE WHEN ${orders.status} = 'shipped' THEN 1 END) as integer)`,
        deliveredOrders: sql<number>`cast(count(CASE WHEN ${orders.status} = 'delivered' THEN 1 END) as integer)`,
      })
        .from(orders)
        .where(and(
          eq(orders.storeId, user.storeId),
          gte(orders.createdAt, startDate)
        ));

      const statsData = stats[0];
      return reply.send({
        data: {
          totalOrders: statsData?.totalOrders || 0,
          revenue: Number(statsData?.revenue || 0),
          pendingOrders: statsData?.pendingOrders || 0,
          processingOrders: statsData?.processingOrders || 0,
          shippedOrders: statsData?.shippedOrders || 0,
          deliveredOrders: statsData?.deliveredOrders || 0,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch stats' });
    }
  });
}
