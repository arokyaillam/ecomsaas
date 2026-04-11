import { FastifyInstance } from 'fastify';
import { db, coupons, orders } from '../db/index.js';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';

// Validation schemas
const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.coerce.number().min(0),
  description: z.string().max(500).optional(),
  minOrderAmount: z.coerce.number().min(0).optional().nullable(),
  maxDiscountAmount: z.coerce.number().min(0).optional().nullable(),
  usageLimit: z.coerce.number().int().min(0).optional().nullable(),
  usageLimitPerCustomer: z.coerce.number().int().min(0).optional().default(1),
  isActive: z.boolean().optional().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  appliesTo: z.enum(['all', 'products', 'categories']).optional().default('all'),
  productIds: z.string().optional().nullable(),
  categoryIds: z.string().optional().nullable(),
  freeShipping: z.boolean().optional().default(false),
});

const updateCouponSchema = z.object({
  description: z.string().max(500).optional(),
  value: z.coerce.number().min(0).optional(),
  minOrderAmount: z.coerce.number().min(0).optional().nullable(),
  maxDiscountAmount: z.coerce.number().min(0).optional().nullable(),
  usageLimit: z.coerce.number().int().min(0).optional().nullable(),
  usageLimitPerCustomer: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  appliesTo: z.enum(['all', 'products', 'categories']).optional(),
  productIds: z.string().optional().nullable(),
  categoryIds: z.string().optional().nullable(),
  freeShipping: z.boolean().optional(),
});

export default async function couponRoutes(fastify: FastifyInstance) {
  // ========== PUBLIC ROUTES ==========

  // Validate coupon
  fastify.get('/validate', async (request, reply) => {
    const { code, storeId, subtotal } = request.query as any;

    try {
      const couponArr = await db.select()
        .from(coupons)
        .where(and(
          eq(coupons.storeId, storeId),
          eq(coupons.code, code.toUpperCase()),
          eq(coupons.isActive, true)
        ))
        .limit(1);

      if (couponArr.length === 0) {
        return reply.status(400).send({ error: 'Invalid coupon code' });
      }

      const coupon = couponArr[0];

      // Check expiry
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return reply.status(400).send({ error: 'Coupon has expired' });
      }

      if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
        return reply.status(400).send({ error: 'Coupon not yet active' });
      }

      // Check usage limit
      if (coupon.usageLimit && Number(coupon.usageCount) >= coupon.usageLimit) {
        return reply.status(400).send({ error: 'Coupon usage limit reached' });
      }

      // Check minimum order amount
      if (coupon.minOrderAmount && Number(subtotal) < Number(coupon.minOrderAmount)) {
        return reply.status(400).send({
          error: `Minimum order amount of $${coupon.minOrderAmount} required`,
        });
      }

      // Calculate discount
      let discount = 0;
      if (coupon.type === 'percentage') {
        discount = Number(subtotal) * (Number(coupon.value) / 100);
        if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
          discount = Number(coupon.maxDiscountAmount);
        }
      } else if (coupon.type === 'fixed_amount') {
        discount = Math.min(Number(coupon.value), Number(subtotal));
      }

      return reply.send({
        data: {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discount: discount.toFixed(2),
          description: coupon.description,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to validate coupon' });
    }
  });

  // ========== ADMIN ROUTES ==========

  // Get all coupons
  fastify.get('/admin', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const { page = '1', limit = '20', status } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(coupons).where(eq(coupons.storeId, user.storeId));

      if (status === 'active') {
        query = db.select().from(coupons).where(
          and(
            eq(coupons.storeId, user.storeId),
            eq(coupons.isActive, true),
            sql`${coupons.expiresAt} IS NULL OR ${coupons.expiresAt} > NOW()`
          )
        );
      } else if (status === 'expired') {
        query = db.select().from(coupons).where(
          and(
            eq(coupons.storeId, user.storeId),
            sql`${coupons.expiresAt} IS NOT NULL AND ${coupons.expiresAt} < NOW()`
          )
        );
      }

      const couponsList = await query
        .orderBy(desc(coupons.createdAt))
        .limit(Number(limit))
        .offset(offset);

      const totalCount = await db.select({ count: count() })
        .from(coupons)
        .where(eq(coupons.storeId, user.storeId));

      return reply.send({
        data: couponsList,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / Number(limit)),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch coupons' });
    }
  });

  // Get coupon by ID
  fastify.get('/admin/:couponId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { couponId } = request.params as { couponId: string };
    const user = request.user as { storeId: string };

    try {
      const couponArr = await db.select()
        .from(coupons)
        .where(and(
          eq(coupons.id, couponId),
          eq(coupons.storeId, user.storeId)
        ))
        .limit(1);

      if (couponArr.length === 0) {
        return reply.status(404).send({ error: 'Coupon not found' });
      }

      return reply.send({ data: couponArr[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch coupon' });
    }
  });

  // Create coupon
  fastify.post('/admin', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const parsed = createCouponSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid coupon data', details: parsed.error.format() });
    }

    const couponData = parsed.data;

    try {
      // Check if code already exists
      const existing = await db.select()
        .from(coupons)
        .where(and(
          eq(coupons.storeId, user.storeId),
          eq(coupons.code, couponData.code.toUpperCase())
        ))
        .limit(1);

      if (existing.length > 0) {
        return reply.status(400).send({ error: 'Coupon code already exists' });
      }

      const newCoupon = await db.insert(coupons).values({
        storeId: user.storeId,
        code: couponData.code.toUpperCase(),
        type: couponData.type,
        value: couponData.value.toString(),
        description: couponData.description || null,
        minOrderAmount: couponData.minOrderAmount?.toString() || null,
        maxDiscountAmount: couponData.maxDiscountAmount?.toString() || null,
        usageLimit: couponData.usageLimit || null,
        usageLimitPerCustomer: couponData.usageLimitPerCustomer,
        isActive: couponData.isActive,
        startsAt: couponData.startsAt ? new Date(couponData.startsAt) : null,
        expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : null,
        appliesTo: couponData.appliesTo,
        productIds: couponData.productIds || null,
        categoryIds: couponData.categoryIds || null,
        freeShipping: couponData.freeShipping,
        usageCount: 0,
      }).returning();

      return reply.send({
        data: newCoupon[0],
        message: 'Coupon created successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create coupon' });
    }
  });

  // Update coupon
  fastify.put('/admin/:couponId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { couponId } = request.params as { couponId: string };
    const user = request.user as { storeId: string };
    const parsed = updateCouponSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid coupon data', details: parsed.error.format() });
    }

    const couponData = parsed.data;

    try {
      const updateData: any = { updatedAt: new Date() };

      if (couponData.description !== undefined) updateData.description = couponData.description;
      if (couponData.value !== undefined) updateData.value = couponData.value.toString();
      if (couponData.minOrderAmount !== undefined) updateData.minOrderAmount = couponData.minOrderAmount?.toString() || null;
      if (couponData.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = couponData.maxDiscountAmount?.toString() || null;
      if (couponData.usageLimit !== undefined) updateData.usageLimit = couponData.usageLimit || null;
      if (couponData.usageLimitPerCustomer !== undefined) updateData.usageLimitPerCustomer = couponData.usageLimitPerCustomer;
      if (couponData.isActive !== undefined) updateData.isActive = couponData.isActive;
      if (couponData.startsAt !== undefined) updateData.startsAt = couponData.startsAt ? new Date(couponData.startsAt) : null;
      if (couponData.expiresAt !== undefined) updateData.expiresAt = couponData.expiresAt ? new Date(couponData.expiresAt) : null;
      if (couponData.appliesTo !== undefined) updateData.appliesTo = couponData.appliesTo;
      if (couponData.productIds !== undefined) updateData.productIds = couponData.productIds || null;
      if (couponData.categoryIds !== undefined) updateData.categoryIds = couponData.categoryIds || null;
      if (couponData.freeShipping !== undefined) updateData.freeShipping = couponData.freeShipping;

      await db.update(coupons)
        .set(updateData)
        .where(and(
          eq(coupons.id, couponId),
          eq(coupons.storeId, user.storeId)
        ));

      return reply.send({ message: 'Coupon updated successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update coupon' });
    }
  });

  // Delete coupon
  fastify.delete('/admin/:couponId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { couponId } = request.params as { couponId: string };
    const user = request.user as { storeId: string };

    try {
      await db.delete(coupons)
        .where(and(
          eq(coupons.id, couponId),
          eq(coupons.storeId, user.storeId)
        ));

      return reply.send({ message: 'Coupon deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete coupon' });
    }
  });
}
