import { FastifyInstance } from 'fastify';
import { db, stores, users, superAdmins, merchantPlans } from '../db/index.js';
import { db as _db, orders, orderItems, products, categories, customers, carts, cartItems, coupons, wishlists, reviews, modifierGroups, modifierOptions, productVariants, productVariantOptions, productVariantCombinations, customerAddresses, emailTemplates, activityLogs, storeAnalytics, subcategories } from '../db/index.js';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { randomBytes } from 'crypto';

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

const deleteConfirmationSchema = z.object({
  confirmationToken: z.string().min(1),
  reason: z.string().min(1)
});

// In-memory store for delete confirmation tokens (use Redis in production)
// FIXME: Migrate to Redis for production - this implementation has limitations:
// - Tokens are lost on server restart
// - Not shared across server instances
// - Memory could grow if tokens are never confirmed
const deleteTokens = new Map<string, { merchantId: string; adminId: string; expiresAt: number }>();

// Cleanup expired tokens every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [token, data] of deleteTokens.entries()) {
    if (data.expiresAt < now) {
      deleteTokens.delete(token);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`[Token Cleanup] Cleaned up ${cleanedCount} expired delete tokens`);
  }
}, 5 * 60 * 1000);

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
    // Skip auth for login route only - exact URL match only
    if (request.url === '/api/super-admin/login') {
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

  // GET /api/super-admin/merchants/:id - Get merchant details with full stats
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

      // Get actual product count
      const productCount = await db.select({ count: count() })
        .from(products)
        .where(eq(products.storeId, id));

      // Get recent orders (last 5)
      const recentOrders = await db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
        .from(orders)
        .where(eq(orders.storeId, id))
        .orderBy(desc(orders.createdAt))
        .limit(5);

      // Get orders by status
      const ordersByStatus = await db.execute(sql`
        SELECT status, COUNT(*) as count, SUM(total::numeric) as revenue
        FROM orders
        WHERE store_id = ${id}
        GROUP BY status
      `);

      // Get stats
      const stats = {
        totalProducts: Number(productCount[0]?.count || 0),
        totalOrders: merchant.totalOrders || 0,
        totalRevenue: merchant.totalRevenue || 0,
        totalCustomers: merchant.totalCustomers || 0,
        recentOrders,
        ordersByStatus: (ordersByStatus as any[]).map(row => ({
          status: row.status,
          count: Number(row.count),
          revenue: Number(row.revenue || 0),
        })),
      };

      // Get recent activity logs (last 10)
      const recentActivity = await db.select()
        .from(activityLogs)
        .where(eq(activityLogs.storeId, id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(10);

      return reply.send({
        data: {
          ...merchant,
          plan,
          owner: ownerArr[0] || null,
          stats,
          recentActivity,
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
      // Get current merchant for audit log
      const merchantArr = await db.select({
        id: stores.id,
        name: stores.name,
        status: stores.status,
        isApproved: stores.isApproved,
      })
        .from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (merchantArr.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      const merchant = merchantArr[0];
      const previousStatus = merchant.status;

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

      // Log the status change
      await db.insert(activityLogs).values({
        storeId: id,
        userId: admin.superAdminId,
        entityType: 'merchant',
        entityId: id,
        action: 'status_changed',
        metadata: {
          merchantName: merchant.name,
          previousStatus,
          newStatus: status,
          reason: reason || null,
          isApproval: status === 'active' && !merchant.isApproved,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] as string,
      });

      return reply.send({
        message: `Merchant status updated to ${status}`,
        data: updated[0]
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // POST /api/super-admin/merchants - Create new merchant (super admin only)
  fastify.post('/merchants', async (request, reply) => {
    const admin = request.user as { superAdminId: string };

    const createMerchantSchema = z.object({
      storeName: z.string().min(2, 'Store name must be at least 2 characters'),
      domain: z.string().min(3, 'Domain must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
      ownerEmail: z.string().email('Invalid email address'),
      ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      planId: z.string().uuid('Invalid plan ID').optional(),
    });

    const parsed = createMerchantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid data', details: parsed.error.format() });
    }

    const { storeName, domain, ownerEmail, ownerName, password, planId } = parsed.data;

    try {
      // Check if domain is already taken
      const existingDomain = await db.select({ id: stores.id })
        .from(stores)
        .where(eq(stores.domain, domain.toLowerCase()))
        .limit(1);

      if (existingDomain.length > 0) {
        return reply.status(409).send({ error: 'Domain is already taken' });
      }

      // Check if email is already registered
      const existingEmail = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.email, ownerEmail.toLowerCase()))
        .limit(1);

      if (existingEmail.length > 0) {
        return reply.status(409).send({ error: 'Email is already registered' });
      }

      // Verify plan exists if provided
      let selectedPlanId = planId;
      if (planId) {
        const planArr = await db.select({ id: merchantPlans.id })
          .from(merchantPlans)
          .where(eq(merchantPlans.id, planId))
          .limit(1);
        if (planArr.length === 0) {
          return reply.status(404).send({ error: 'Plan not found' });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create store and owner in transaction
      const result = await db.transaction(async (tx) => {
        // Create the store
        const [store] = await tx.insert(stores).values({
          name: storeName,
          domain: domain.toLowerCase(),
          ownerEmail: ownerEmail.toLowerCase(),
          ownerName,
          status: 'active',
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: admin.superAdminId,
          planId: selectedPlanId || null,
          totalOrders: 0,
          totalRevenue: 0,
          totalCustomers: 0,
        }).returning();

        // Create the owner user
        const [owner] = await tx.insert(users).values({
          storeId: store.id,
          email: ownerEmail.toLowerCase(),
          password: hashedPassword,
          name: ownerName,
          role: 'OWNER',
          isActive: true,
        }).returning();

        return { store, owner };
      });

      // Log the creation
      await db.insert(activityLogs).values({
        storeId: result.store.id,
        userId: admin.superAdminId,
        entityType: 'merchant',
        entityId: result.store.id,
        action: 'created',
        metadata: {
          merchantName: storeName,
          domain: domain.toLowerCase(),
          ownerEmail: ownerEmail.toLowerCase(),
          ownerName,
          planId: selectedPlanId,
          createdBy: 'super_admin',
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] as string,
      });

      return reply.status(201).send({
        message: 'Merchant created successfully',
        data: {
          store: {
            id: result.store.id,
            name: result.store.name,
            domain: result.store.domain,
            status: result.store.status,
            isApproved: result.store.isApproved,
            ownerEmail: result.store.ownerEmail,
            ownerName: result.store.ownerName,
            planId: result.store.planId,
            createdAt: result.store.createdAt,
          },
          owner: {
            id: result.owner.id,
            email: result.owner.email,
            name: result.owner.name,
            role: result.owner.role,
          },
        },
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

  // POST /api/super-admin/merchants/:id/delete-request - Request delete confirmation
  fastify.post('/merchants/:id/delete-request', async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.user as { superAdminId: string };

    try {
      // Verify merchant exists
      const merchantArr = await db.select({
        id: stores.id,
        name: stores.name,
        domain: stores.domain,
        totalOrders: stores.totalOrders,
        totalCustomers: stores.totalCustomers,
      })
        .from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (merchantArr.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      const merchant = merchantArr[0];

      // Check if merchant has significant data
      const hasData = Number(merchant.totalOrders || 0) > 0 || Number(merchant.totalCustomers || 0) > 0;

      // Generate cryptographically secure confirmation token (valid for 10 minutes)
      const confirmationToken = randomBytes(32).toString('hex');
      deleteTokens.set(confirmationToken, {
        merchantId: id,
        adminId: admin.superAdminId,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // Log the delete request
      await db.insert(activityLogs).values({
        storeId: id,
        userId: admin.superAdminId,
        entityType: 'merchant',
        entityId: id,
        action: 'delete_requested',
        metadata: {
          merchantName: merchant.name,
          domain: merchant.domain,
          hasData,
          token: confirmationToken.substring(0, 20) + '...', // Partial token for reference
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] as string,
      });

      return reply.send({
        message: 'Delete confirmation required',
        data: {
          confirmationToken,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          merchant: {
            id: merchant.id,
            name: merchant.name,
            domain: merchant.domain,
            totalOrders: Number(merchant.totalOrders || 0),
            totalCustomers: Number(merchant.totalCustomers || 0),
          },
          warning: hasData
            ? 'This merchant has orders and customers. Deletion is irreversible.'
            : 'This action is irreversible.',
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // POST /api/super-admin/merchants/:id/delete-confirm - Confirm and execute delete
  fastify.post('/merchants/:id/delete-confirm', async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.user as { superAdminId: string };

    fastify.log.info(`Delete confirm request for merchant ${id} by admin ${admin.superAdminId}`);
    fastify.log.info(`Request body: ${JSON.stringify(request.body)}`);

    const parsed = deleteConfirmationSchema.safeParse(request.body);
    if (!parsed.success) {
      fastify.log.error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
      return reply.status(400).send({ error: 'Invalid confirmation data', details: parsed.error.format() });
    }

    const { confirmationToken, reason } = parsed.data;
    fastify.log.info(`Token received: ${confirmationToken.substring(0, 20)}...`);

    try {
      // Validate token
      const tokenData = deleteTokens.get(confirmationToken);
      fastify.log.info(`Token data found: ${!!tokenData}`);

      if (!tokenData) {
        fastify.log.error('Delete confirmation token not found');
        return reply.status(400).send({ error: 'Invalid confirmation token' });
      }

      if (tokenData.merchantId !== id) {
        fastify.log.error(`Merchant ID mismatch: expected ${id}, got ${tokenData.merchantId}`);
        return reply.status(400).send({ error: 'Invalid confirmation token for this merchant' });
      }

      if (tokenData.adminId !== admin.superAdminId) {
        fastify.log.error(`Admin ID mismatch`);
        return reply.status(400).send({ error: 'Invalid confirmation token for this admin' });
      }

      if (tokenData.expiresAt < Date.now()) {
        deleteTokens.delete(confirmationToken);
        return reply.status(400).send({ error: 'Confirmation token expired. Please request delete again.' });
      }

      // Verify merchant exists
      const merchantArr = await db.select({
        id: stores.id,
        name: stores.name,
        domain: stores.domain,
      })
        .from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (merchantArr.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      const merchant = merchantArr[0];

      // Perform cascade delete in transaction
      // Note: Activity logs are cascade deleted, so we can't log the deletion event persistently
      // without a separate audit table. For now, we rely on the delete-request log.
      try {
        await db.transaction(async (tx) => {
          try {
            // Delete in order of dependencies (child → parent)
            fastify.log.info(`[Delete] Starting cascade delete for store ${id}`);

            await tx.delete(storeAnalytics).where(eq(storeAnalytics.storeId, id));
            fastify.log.info(`[Delete] Deleted storeAnalytics`);

            await tx.delete(emailTemplates).where(eq(emailTemplates.storeId, id));
            fastify.log.info(`[Delete] Deleted emailTemplates`);

            // Order items first, then orders
            const storeOrders = await tx.select({ id: orders.id }).from(orders).where(eq(orders.storeId, id));
            fastify.log.info(`[Delete] Found ${storeOrders.length} orders`);
            for (const order of storeOrders) {
              await tx.delete(orderItems).where(eq(orderItems.orderId, order.id));
            }
            await tx.delete(orders).where(eq(orders.storeId, id));
            fastify.log.info(`[Delete] Deleted orders and orderItems`);

            // Cart items first, then carts
            const storeCarts = await tx.select({ id: carts.id }).from(carts).where(eq(carts.storeId, id));
            for (const cart of storeCarts) {
              await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
            }
            await tx.delete(carts).where(eq(carts.storeId, id));
            fastify.log.info(`[Delete] Deleted carts and cartItems`);

            // Customer addresses first, then customers
            const storeCustomers = await tx.select({ id: customers.id }).from(customers).where(eq(customers.storeId, id));
            for (const customer of storeCustomers) {
              await tx.delete(customerAddresses).where(eq(customerAddresses.customerId, customer.id));
            }
            await tx.delete(customers).where(eq(customers.storeId, id));
            fastify.log.info(`[Delete] Deleted customers and addresses`);

            // Product-related: combinations → options → variants → modifier options → groups → subcategories → products
            await tx.delete(productVariantCombinations).where(eq(productVariantCombinations.storeId, id));
            const storeVariants = await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.storeId, id));
            for (const variant of storeVariants) {
              await tx.delete(productVariantOptions).where(eq(productVariantOptions.variantId, variant.id));
            }
            await tx.delete(productVariants).where(eq(productVariants.storeId, id));
            fastify.log.info(`[Delete] Deleted product variants`);

            await tx.delete(modifierOptions).where(eq(modifierOptions.storeId, id));
            await tx.delete(modifierGroups).where(eq(modifierGroups.storeId, id));
            fastify.log.info(`[Delete] Deleted modifiers`);

            await tx.delete(wishlists).where(eq(wishlists.storeId, id));
            await tx.delete(reviews).where(eq(reviews.storeId, id));
            await tx.delete(coupons).where(eq(coupons.storeId, id));
            fastify.log.info(`[Delete] Deleted wishlists, reviews, coupons`);

            await tx.delete(products).where(eq(products.storeId, id));
            await tx.delete(subcategories).where(eq(subcategories.storeId, id));
            await tx.delete(categories).where(eq(categories.storeId, id));
            fastify.log.info(`[Delete] Deleted products, subcategories, categories`);

            // Delete activity logs for this store
            await tx.delete(activityLogs).where(eq(activityLogs.storeId, id));
            fastify.log.info(`[Delete] Deleted activity logs`);

            // Finally, delete users and the store
            await tx.delete(users).where(eq(users.storeId, id));
            fastify.log.info(`[Delete] Deleted users`);

            await tx.delete(stores).where(eq(stores.id, id));
            fastify.log.info(`[Delete] Deleted store ${id} - SUCCESS`);
          } catch (innerError: any) {
            fastify.log.error(`[Delete] Inner transaction error: ${innerError.message}`);
            throw innerError; // Re-throw to trigger rollback
          }
        });
      } catch (txError: any) {
        fastify.log.error(`Transaction failed during merchant deletion: ${txError.message}`);
        fastify.log.error(`Transaction error stack: ${txError.stack}`);
        return reply.status(500).send({ error: 'Failed to delete merchant', details: txError.message });
      }

      // Clean up token
      deleteTokens.delete(confirmationToken);

      return reply.send({
        message: 'Merchant deleted successfully',
        data: {
          deleted: {
            id: merchant.id,
            name: merchant.name,
            domain: merchant.domain,
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/super-admin/merchants/:id/approve - Approve merchant (convenience endpoint)
  fastify.put('/merchants/:id/approve', async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.user as { superAdminId: string };

    try {
      // Get current merchant status
      const merchantArr = await db.select({
        id: stores.id,
        name: stores.name,
        status: stores.status,
        isApproved: stores.isApproved,
      })
        .from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (merchantArr.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      const merchant = merchantArr[0];

      if (merchant.status === 'active' && merchant.isApproved) {
        return reply.status(400).send({ error: 'Merchant is already approved and active' });
      }

      // Update to active and approved
      const updated = await db.update(stores)
        .set({
          status: 'active',
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: admin.superAdminId,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, id))
        .returning();

      // Log approval
      await db.insert(activityLogs).values({
        storeId: id,
        userId: admin.superAdminId,
        entityType: 'merchant',
        entityId: id,
        action: 'approved',
        metadata: {
          merchantName: merchant.name,
          previousStatus: merchant.status,
          approvedAt: new Date().toISOString(),
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] as string,
      });

      return reply.send({
        message: 'Merchant approved successfully',
        data: updated[0],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/super-admin/merchants/:id/suspend - Suspend merchant
  fastify.put('/merchants/:id/suspend', async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.user as { superAdminId: string };

    const bodySchema = z.object({
      reason: z.string().min(1, 'Suspension reason is required'),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid data', details: parsed.error.format() });
    }

    const { reason } = parsed.data;

    try {
      // Get current merchant status
      const merchantArr = await db.select({
        id: stores.id,
        name: stores.name,
        status: stores.status,
        isApproved: stores.isApproved,
      })
        .from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (merchantArr.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      const merchant = merchantArr[0];

      if (merchant.status === 'suspended') {
        return reply.status(400).send({ error: 'Merchant is already suspended' });
      }

      // Update to suspended
      const updated = await db.update(stores)
        .set({
          status: 'suspended',
          updatedAt: new Date(),
        })
        .where(eq(stores.id, id))
        .returning();

      // Log suspension
      await db.insert(activityLogs).values({
        storeId: id,
        userId: admin.superAdminId,
        entityType: 'merchant',
        entityId: id,
        action: 'suspended',
        metadata: {
          merchantName: merchant.name,
          previousStatus: merchant.status,
          reason,
          suspendedAt: new Date().toISOString(),
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] as string,
      });

      return reply.send({
        message: 'Merchant suspended successfully',
        data: {
          ...updated[0],
          suspensionReason: reason,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // GET /api/super-admin/merchants/:id/activity - Get merchant activity logs
  fastify.get('/merchants/:id/activity', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page = '1', limit = '20' } = request.query as any;

    try {
      // Verify merchant exists
      const merchantArr = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, id)).limit(1);
      if (merchantArr.length === 0) {
        return reply.status(404).send({ error: 'Merchant not found' });
      }

      const offset = (Number(page) - 1) * Number(limit);

      const logs = await db.select()
        .from(activityLogs)
        .where(eq(activityLogs.storeId, id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(Number(limit))
        .offset(offset);

      const totalCount = await db.select({ count: count() })
        .from(activityLogs)
        .where(eq(activityLogs.storeId, id));

      return reply.send({
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / Number(limit)),
        },
      });
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
