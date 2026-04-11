import { FastifyInstance } from 'fastify';
import { db, stores, users, superAdmins, merchantPlans } from '../db/index.js';
import { db as _db, orders, orderItems, products, categories, customers, carts, cartItems, coupons, wishlists, reviews, modifierGroups, modifierOptions, productVariants, productVariantOptions, productVariantCombinations, customerAddresses, emailTemplates, activityLogs, storeAnalytics, subcategories } from '../db/index.js';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const merchantStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'deactivated']),
  reason: z.string().optional()
});

const merchantPlanSchema = z.object({
  planId: z.string().uuid(),
  expiresAt: z.string().datetime().optional()
});

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  interval: z.enum(['month', 'year']).default('month'),
  features: z.array(z.string()).default([]),
  maxProducts: z.coerce.number().default(100),
  maxStorage: z.coerce.number().default(1024),
  isActive: z.boolean().default(true)
});

export default async function superAdminRoutes(fastify: FastifyInstance) {
  // ==================== SUPER ADMIN AUTH ====================

  // POST /api/super-admin/login (PUBLIC - No auth required)
  fastify.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid credentials' });
    }

    const { email, password } = parsed.data;

    try {
      const adminArr = await db.select()
        .from(superAdmins)
        .where(eq(superAdmins.email, email.toLowerCase()))
        .limit(1);

      if (adminArr.length === 0) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const admin = adminArr[0];

      if (!admin.isActive) {
        return reply.status(401).send({ error: 'Account deactivated' });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Update last login
      await db.update(superAdmins)
        .set({ lastLoginAt: new Date() })
        .where(eq(superAdmins.id, admin.id));

      // Generate token
      const token = fastify.jwt.sign({
        superAdminId: admin.id,
        email: admin.email,
        role: 'SUPER_ADMIN'
      }, { expiresIn: '7d' });

      return reply.send({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // ==================== PROTECTED ROUTES ====================

  // Pre-handler for protected routes (excludes /login)
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for login route
    if (request.url === '/api/super-admin/login' || request.url.endsWith('/login')) {
      return;
    }

    try {
      await request.jwtVerify();
      const user = request.user as { role?: string };
      if (user?.role !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden: Super Admin access required' });
      }
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // ==================== MERCHANT MANAGEMENT ====================

  // GET /api/super-admin/merchants - List all merchants
  fastify.get('/merchants', async (request, reply) => {
    const {
      page = '1',
      limit = '20',
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      // Build where conditions
      const conditions = [];
      if (status) {
        conditions.push(eq(stores.status, status));
      }
      if (search) {
        const searchLower = `%${search.toLowerCase()}%`;
        conditions.push(
          sql`(
            LOWER(${stores.name}) LIKE ${searchLower} OR
            LOWER(${stores.domain}) LIKE ${searchLower} OR
            LOWER(${stores.ownerEmail}) LIKE ${searchLower}
          )`
        );
      }

      const whereClause = conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : and(...conditions)
        : undefined;

      // Get total count with filters
      const totalCount = whereClause
        ? await db.select({ count: count() }).from(stores).where(whereClause)
        : await db.select({ count: count() }).from(stores);

      // Apply sorting
      const orderBy = sortOrder === 'asc' ? asc(stores.createdAt) : desc(stores.createdAt);

      // Get merchants with pagination and filters
      const merchants = whereClause
        ? await db.select().from(stores).where(whereClause).orderBy(orderBy).limit(Number(limit)).offset(offset)
        : await db.select().from(stores).orderBy(orderBy).limit(Number(limit)).offset(offset);

      // Get plan details for each merchant
      const merchantsWithPlans = await Promise.all(
        merchants.map(async (merchant) => {
          let plan = null;
          if (merchant.planId) {
            const planArr = await db.select()
              .from(merchantPlans)
              .where(eq(merchantPlans.id, merchant.planId))
              .limit(1);
            plan = planArr[0] || null;
          }
          return { ...merchant, plan };
        })
      );

      return reply.send({
        data: merchantsWithPlans,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / Number(limit))
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // GET /api/super-admin/merchants/:id - Get merchant details
  fastify.get('/merchants/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const merchantArr = await db.select()
        .from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (merchantArr.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      const merchant = merchantArr[0];

      // Get plan details
      let plan = null;
      if (merchant.planId) {
        const planArr = await db.select()
          .from(merchantPlans)
          .where(eq(merchantPlans.id, merchant.planId))
          .limit(1);
        plan = planArr[0] || null;
      }

      // Get owner details (exclude password hash)
      const ownerArr = await db.select({
        id: users.id,
        email: users.email,
        role: users.role,
        storeId: users.storeId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
        .from(users)
        .where(and(
          eq(users.storeId, id),
          eq(users.role, 'OWNER')
        ))
        .limit(1);

      // Get stats
      const stats = {
        totalProducts: 0, // Would need to query products table
        totalOrders: merchant.totalOrders || 0,
        totalRevenue: merchant.totalRevenue || 0,
        totalCustomers: merchant.totalCustomers || 0
      };

      return reply.send({
        data: {
          ...merchant,
          plan,
          owner: ownerArr[0] || null,
          stats
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/super-admin/merchants/:id/status - Update merchant status
  fastify.put('/merchants/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = merchantStatusSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid status data', details: parsed.error.format() });
    }

    const { status, reason } = parsed.data;
    const admin = request.user as { superAdminId: string };

    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'active') {
        updateData.isApproved = true;
        updateData.approvedAt = new Date();
        updateData.approvedBy = admin.superAdminId;
      }

      const updated = await db.update(stores)
        .set(updateData)
        .where(eq(stores.id, id))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      return reply.send({
        message: `Merchant status updated to ${status}`,
        data: updated[0]
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/super-admin/merchants/:id/plan - Update merchant plan
  fastify.put('/merchants/:id/plan', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = merchantPlanSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid plan data', details: parsed.error.format() });
    }

    const { planId, expiresAt } = parsed.data;

    try {
      // Verify plan exists
      const planArr = await db.select()
        .from(merchantPlans)
        .where(eq(merchantPlans.id, planId))
        .limit(1);

      if (planArr.length === 0) {
        return reply.status(404).send({ error: 'Plan not found' });
      }

      const updated = await db.update(stores)
        .set({
          planId,
          planExpiresAt: expiresAt ? new Date(expiresAt) : null,
          updatedAt: new Date()
        })
        .where(eq(stores.id, id))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      return reply.send({
        message: 'Merchant plan updated',
        data: updated[0]
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // DELETE /api/super-admin/merchants/:id - Delete merchant (with cascade)
  fastify.delete('/merchants/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify store exists
      const storeArr = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, id)).limit(1);
      if (storeArr.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      // Delete all store-related data in a transaction to avoid FK violations
      await db.transaction(async (tx) => {
        // Delete in order of dependencies (child → parent)
        await tx.delete(storeAnalytics).where(eq(storeAnalytics.storeId, id));
        await tx.delete(activityLogs).where(eq(activityLogs.storeId, id));
        await tx.delete(emailTemplates).where(eq(emailTemplates.storeId, id));

        // Order items first, then orders
        const storeOrders = await tx.select({ id: orders.id }).from(orders).where(eq(orders.storeId, id));
        for (const order of storeOrders) {
          await tx.delete(orderItems).where(eq(orderItems.orderId, order.id));
        }
        await tx.delete(orders).where(eq(orders.storeId, id));

        // Cart items first, then carts
        const storeCarts = await tx.select({ id: carts.id }).from(carts).where(eq(carts.storeId, id));
        for (const cart of storeCarts) {
          await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
        }
        await tx.delete(carts).where(eq(carts.storeId, id));

        // Customer addresses first, then customers
        const storeCustomers = await tx.select({ id: customers.id }).from(customers).where(eq(customers.storeId, id));
        for (const customer of storeCustomers) {
          await tx.delete(customerAddresses).where(eq(customerAddresses.customerId, customer.id));
        }
        await tx.delete(customers).where(eq(customers.storeId, id));

        // Product-related: combinations → options → variants → modifier options → groups → subcategories → products
        await tx.delete(productVariantCombinations).where(eq(productVariantCombinations.storeId, id));
        const storeVariants = await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.storeId, id));
        for (const variant of storeVariants) {
          await tx.delete(productVariantOptions).where(eq(productVariantOptions.variantId, variant.id));
        }
        await tx.delete(productVariants).where(eq(productVariants.storeId, id));

        await tx.delete(modifierOptions).where(eq(modifierOptions.storeId, id));
        await tx.delete(modifierGroups).where(eq(modifierGroups.storeId, id));

        await tx.delete(wishlists).where(eq(wishlists.storeId, id));
        await tx.delete(reviews).where(eq(reviews.storeId, id));
        await tx.delete(coupons).where(eq(coupons.storeId, id));

        const storeProducts = await tx.select({ id: products.id }).from(products).where(eq(products.storeId, id));
        // Order items referencing these products were already deleted above
        await tx.delete(products).where(eq(products.storeId, id));

        await tx.delete(subcategories).where(eq(subcategories.storeId, id));
        await tx.delete(categories).where(eq(categories.storeId, id));

        // Finally, delete users and the store
        await tx.delete(users).where(eq(users.storeId, id));
        await tx.delete(stores).where(eq(stores.id, id));
      });

      return reply.send({ message: 'Merchant deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // ==================== DASHBOARD STATS ====================

  // GET /api/super-admin/dashboard - Get dashboard stats
  fastify.get('/dashboard', async (request, reply) => {
    try {
      // Total merchants
      const totalMerchants = await db.select({ count: count() }).from(stores);

      // Merchants by status
      const merchantsByStatusRaw = await db.execute(sql`
        SELECT status, COUNT(*) as count
        FROM stores
        GROUP BY status
      `);
      const merchantsByStatus = (merchantsByStatusRaw as any[]).map(row => ({
        status: row.status,
        count: Number(row.count)
      }));

      // Total revenue across all merchants
      const totalRevenue = await db.select({
        total: sql`COALESCE(SUM(total_revenue::numeric), 0)`
      }).from(stores);

      // Total orders across all merchants
      const totalOrders = await db.select({
        total: sql`COALESCE(SUM(total_orders), 0)`
      }).from(stores);

      // Recent merchants (last 30 days for better coverage)
      const recentMerchants = await db.select()
        .from(stores)
        .orderBy(desc(stores.createdAt))
        .limit(5);

      return reply.send({
        data: {
          totalMerchants: Number(totalMerchants[0].count),
          merchantsByStatus,
          totalRevenue: Number(totalRevenue[0].total),
          totalOrders: Number(totalOrders[0].total),
          recentMerchants
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // ==================== PLAN MANAGEMENT ====================

  // GET /api/super-admin/plans - List all plans
  fastify.get('/plans', async (request, reply) => {
    try {
      const plans = await db.select()
        .from(merchantPlans)
        .orderBy(asc(merchantPlans.price));

      return reply.send({ data: plans });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // POST /api/super-admin/plans - Create new plan
  fastify.post('/plans', async (request, reply) => {
    const parsed = planSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid plan data', details: parsed.error.format() });
    }

    try {
      const newPlan = await db.insert(merchantPlans).values({
        ...parsed.data,
        features: parsed.data.features
      }).returning();

      return reply.status(201).send({
        message: 'Plan created',
        data: newPlan[0]
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/super-admin/plans/:id - Update plan
  fastify.put('/plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = planSchema.partial().safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid plan data', details: parsed.error.format() });
    }

    try {
      const updateData: any = { ...parsed.data, updatedAt: new Date() };
      if (parsed.data.features) {
        updateData.features = parsed.data.features;
      }

      const updated = await db.update(merchantPlans)
        .set(updateData)
        .where(eq(merchantPlans.id, id))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Plan not found' });
      }

      return reply.send({
        message: 'Plan updated',
        data: updated[0]
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // DELETE /api/super-admin/plans/:id - Delete plan
  fastify.delete('/plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      // Check if any merchants are using this plan
      const usingPlan = await db.select({ count: count() })
        .from(stores)
        .where(eq(stores.planId, id));

      if (Number(usingPlan[0].count) > 0) {
        return reply.status(400).send({
          error: 'Cannot delete plan: merchants are currently using it'
        });
      }

      const deleted = await db.delete(merchantPlans)
        .where(eq(merchantPlans.id, id))
        .returning({ id: merchantPlans.id });

      if (deleted.length === 0) {
        return reply.status(404).send({ error: 'Plan not found' });
      }

      return reply.send({ message: 'Plan deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
