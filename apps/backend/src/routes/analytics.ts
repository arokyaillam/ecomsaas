import { FastifyInstance } from 'fastify';
import { db, orders, products, customers, storeAnalytics, reviews } from '../db/index.js';
import { eq, and, desc, sql, gte, lte, count, avg } from 'drizzle-orm';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  // ========== ADMIN DASHBOARD ANALYTICS ==========

  // Get dashboard stats
  fastify.get('/dashboard', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { storeId?: string };
        if (!user?.storeId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const { period = 'today' } = request.query as any;

    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Format date for SQL
      const startDateStr = startDate.toISOString();

      // Total revenue
      const revenueData = await db.execute(sql`
        SELECT COALESCE(SUM(total::numeric), 0) as revenue
        FROM orders
        WHERE store_id = ${user.storeId}
        AND status != 'cancelled'
        AND created_at >= ${startDateStr}
      `);

      // Total orders
      const ordersData = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM orders
        WHERE store_id = ${user.storeId}
        AND created_at >= ${startDateStr}
      `);

      // Total customers
      const customersData = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM customers
        WHERE store_id = ${user.storeId}
        AND created_at >= ${startDateStr}
      `);

      // Average order value
      const aovData = await db.execute(sql`
        SELECT COALESCE(AVG(total::numeric), 0) as aov
        FROM orders
        WHERE store_id = ${user.storeId}
        AND status != 'cancelled'
        AND created_at >= ${startDateStr}
      `);

      // Sales by status
      const statusData = await db.execute(sql`
        SELECT status, COUNT(*) as count
        FROM orders
        WHERE store_id = ${user.storeId}
        AND created_at >= ${startDateStr}
        GROUP BY status
      `);

      // Top products - use Drizzle query instead of raw SQL for better type safety
      const topProductsData = await db.execute(sql`
        SELECT
          p.id,
          p.title_en as title,
          p.images,
          COUNT(oi.id) as order_count,
          COALESCE(SUM(oi.total::numeric), 0) as revenue
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id AND o.created_at >= ${startDateStr}
        WHERE p.store_id = ${user.storeId}
        GROUP BY p.id, p.title_en, p.images
        ORDER BY revenue DESC
        LIMIT 5
      `).catch(() => []);
      const topProducts = topProductsData as unknown as any[];

      const revenueDataArr = revenueData as unknown as any[];
      const ordersDataArr = ordersData as unknown as any[];
      const customersDataArr = customersData as unknown as any[];
      const aovDataArr = aovData as unknown as any[];
      const statusDataArr = statusData as unknown as any[];

      return reply.send({
        data: {
          revenue: Number(revenueDataArr[0]?.revenue || 0),
          orders: Number(ordersDataArr[0]?.count || 0),
          customers: Number(customersDataArr[0]?.count || 0),
          averageOrderValue: Number(aovDataArr[0]?.aov || 0),
          statusBreakdown: statusDataArr,
          topProducts: topProducts,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch analytics' });
    }
  });

  // Get sales chart data
  fastify.get('/sales-chart', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { storeId?: string };
        if (!user?.storeId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const { period = '7d' } = request.query as any;

    try {
      let days: number;

      switch (period) {
        case '24h':
          days = 1;
          break;
        case '7d':
          days = 7;
          break;
        case '30d':
          days = 30;
          break;
        case '12m':
          days = 365;
          break;
        default:
          days = 7;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      // Simple query to get orders grouped by date
      const chartData = await db.execute(sql`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total::numeric ELSE 0 END), 0) as revenue
        FROM orders
        WHERE store_id = ${user.storeId}
        AND created_at >= ${startDateStr}
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      const chartDataArr = chartData as unknown as any[];

      // Fill in missing dates with zeros
      const result: Array<{date: string; orders: number; revenue: number}> = [];
      const dataMap = new Map(chartDataArr.map((r: any) => [new Date(r.date).toISOString().split('T')[0], r]));

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const row = dataMap.get(dateStr);
        result.push({
          date: dateStr,
          orders: row ? Number(row.orders) : 0,
          revenue: row ? Number(row.revenue) : 0,
        });
      }

      return reply.send({ data: result });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch chart data' });
    }
  });

  // Get traffic/conversion stats
  fastify.get('/conversion', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { storeId?: string };
        if (!user?.storeId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const { period = '30d' } = request.query as any;

    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      // Get analytics from table or calculate
      const stats = await db.execute(sql`
        SELECT
          COALESCE(SUM(visitors), 0) as visitors,
          COALESCE(SUM(page_views), 0) as pageViews,
          COALESCE(SUM(add_to_carts), 0) as addToCarts,
          COALESCE(SUM(checkouts_started), 0) as checkoutsStarted,
          COALESCE(SUM(checkouts_completed), 0) as checkoutsCompleted,
          COALESCE(SUM(orders), 0) as orders,
          COALESCE(SUM(revenue::numeric), 0) as revenue
        FROM store_analytics
        WHERE store_id = ${user.storeId}
        AND date >= ${startDateStr}
      `).catch(() => [{ visitors: 0, pageviews: 0, addtocarts: 0, checkoutsstarted: 0, checkoutscompleted: 0, orders: 0, revenue: 0 }]);

      const statsArr = stats as unknown as any[];
      const data = statsArr[0] || { visitors: 0, pageviews: 0, addtocarts: 0, checkoutsstarted: 0, checkoutscompleted: 0, orders: 0, revenue: 0 };
      const visitors = Number(data.visitors || 0);
      const checkoutsCompleted = Number(data.checkoutscompleted || 0);

      return reply.send({
        data: {
          visitors: Number(data.visitors || 0),
          pageViews: Number(data.pageviews || 0),
          addToCarts: Number(data.addtocarts || 0),
          checkoutsStarted: Number(data.checkoutsstarted || 0),
          checkoutsCompleted: checkoutsCompleted,
          orders: Number(data.orders || 0),
          revenue: Number(data.revenue || 0),
          conversionRate: visitors > 0 ? ((checkoutsCompleted / visitors) * 100).toFixed(2) : 0,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch conversion stats' });
    }
  });

  // Get customer analytics
  fastify.get('/customers', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { storeId?: string };
        if (!user?.storeId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { storeId: string };

    try {
      // Total customers
      const totalCustomers = await db.select({ count: count() })
        .from(customers)
        .where(eq(customers.storeId, user.storeId));

      // New customers this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthStartStr = monthStart.toISOString();

      const newCustomers = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM customers
        WHERE store_id = ${user.storeId}
        AND created_at >= ${monthStartStr}
      `);

      // Repeat customers
      const repeatCustomers = await db.execute(sql`
        SELECT COUNT(DISTINCT customer_id) as count
        FROM orders
        WHERE store_id = ${user.storeId}
        AND customer_id IS NOT NULL
        GROUP BY customer_id
        HAVING COUNT(*) > 1
      `);

      // Customer lifetime value
      const clv = await db.execute(sql`
        SELECT AVG(total_spent) as avg_clv
        FROM (
          SELECT customer_id, SUM(total::numeric) as total_spent
          FROM orders
          WHERE store_id = ${user.storeId}
          AND status != 'cancelled'
          AND customer_id IS NOT NULL
          GROUP BY customer_id
        ) as customer_totals
      `);

      const newCustomersData = newCustomers as unknown as any[];
      const repeatCustomersData = repeatCustomers as unknown as any[];
      const clvData = clv as unknown as any[];

      return reply.send({
        data: {
          totalCustomers: Number(totalCustomers[0].count),
          newCustomersThisMonth: Number(newCustomersData[0]?.count || 0),
          repeatCustomers: repeatCustomersData.length,
          averageLifetimeValue: Number(clvData[0]?.avg_clv || 0),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch customer analytics' });
    }
  });

  // Get product analytics
  fastify.get('/products', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { storeId?: string };
        if (!user?.storeId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const { page = '1', limit = '20' } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      const productStats = await db.execute(sql`
        SELECT
          p.id,
          p.title_en as title,
          p.images,
          p.current_quantity as stock,
          COALESCE(SUM(oi.quantity), 0) as units_sold,
          COALESCE(SUM(oi.total::numeric), 0) as revenue,
          COUNT(DISTINCT o.id) as orders
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
        WHERE p.store_id = ${user.storeId}
        GROUP BY p.id, p.title_en, p.images, p.current_quantity
        ORDER BY revenue DESC
        LIMIT ${Number(limit)}
        OFFSET ${offset}
      `).catch((err) => {
        fastify.log.error('Product analytics query error:', err);
        return [];
      });

      const productStatsData = productStats as unknown as any[];
      return reply.send({
        data: productStatsData,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch product analytics' });
    }
  });

  // Track analytics event (from storefront)
  fastify.post('/track', async (request, reply) => {
    const { storeId, event, data } = request.body as any;

    try {
      // This would typically use a queue or analytics service
      // For now, we'll just acknowledge receipt
      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to track event' });
    }
  });
}
