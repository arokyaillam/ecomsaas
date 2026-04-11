import { FastifyInstance } from 'fastify';
import { db, reviews, products, customers, orders, orderItems } from '../db/index.js';
import { eq, and, desc, avg, count, sql } from 'drizzle-orm';

export default async function reviewRoutes(fastify: FastifyInstance) {
  // ========== PUBLIC ROUTES ==========

  // Get product reviews
  fastify.get('/product/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const { page = '1', limit = '10', sort = 'newest' } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      let orderBy: any = desc(reviews.createdAt);
      if (sort === 'oldest') orderBy = sql`${reviews.createdAt}`;
      if (sort === 'highest') orderBy = desc(reviews.rating);
      if (sort === 'lowest') orderBy = sql`${reviews.rating}`;
      if (sort === 'helpful') orderBy = desc(reviews.helpfulCount);

      const reviewsList = await db.select({
        review: reviews,
        customer: {
          firstName: customers.firstName,
          lastName: customers.lastName,
          avatarUrl: customers.avatarUrl,
        },
      })
      .from(reviews)
      .leftJoin(customers, eq(reviews.customerId, customers.id))
      .where(and(
        eq(reviews.productId, productId),
        eq(reviews.isApproved, true)
      ))
      .orderBy(orderBy)
      .limit(Number(limit))
      .offset(offset);

      // Get rating summary
      const ratingStats = await db.select({
        rating: reviews.rating,
        count: count(),
      })
      .from(reviews)
      .where(and(
        eq(reviews.productId, productId),
        eq(reviews.isApproved, true)
      ))
      .groupBy(reviews.rating);

      const totalReviews = ratingStats.reduce((sum, s) => sum + Number(s.count), 0);
      const averageRating = totalReviews > 0
        ? ratingStats.reduce((sum, s) => sum + (Number(s.rating) * Number(s.count)), 0) / totalReviews
        : 0;

      // Calculate rating distribution
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratingStats.forEach(s => {
        distribution[s.rating as keyof typeof distribution] = Number(s.count);
      });

      return reply.send({
        data: reviewsList.map(({ review, customer }) => ({
          ...review,
          customer: customer?.firstName ? {
            name: `${customer.firstName} ${customer.lastName?.charAt(0) || ''}.`,
            avatarUrl: customer.avatarUrl,
          } : null,
        })),
        summary: {
          averageRating: Number(averageRating.toFixed(1)),
          totalReviews,
          distribution,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalReviews,
          totalPages: Math.ceil(totalReviews / Number(limit)),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch reviews' });
    }
  });

  // Mark review as helpful
  fastify.post('/:reviewId/helpful', async (request, reply) => {
    const { reviewId } = request.params as { reviewId: string };

    try {
      await db.update(reviews)
        .set({
          helpfulCount: sql`${reviews.helpfulCount} + 1`,
        })
        .where(eq(reviews.id, reviewId));

      return reply.send({ message: 'Review marked as helpful' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update review' });
    }
  });

  // ========== CUSTOMER ROUTES ==========

  // Create review
  fastify.post('/', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { customerId: string; storeId: string };
    const { productId, orderId, rating, title, content, images } = request.body as any;

    try {
      // Check if customer has purchased this product
      const orderItem = await db.select()
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(orders.customerId, user.customerId),
          eq(orderItems.productId, productId),
          eq(orders.status, 'delivered')
        ))
        .limit(1);

      const isVerified = orderItem.length > 0;

      // Check if already reviewed
      const existingReview = await db.select()
        .from(reviews)
        .where(and(
          eq(reviews.productId, productId),
          eq(reviews.customerId, user.customerId)
        ))
        .limit(1);

      if (existingReview.length > 0) {
        return reply.status(400).send({ error: 'You have already reviewed this product' });
      }

      const newReview = await db.insert(reviews).values({
        storeId: user.storeId,
        productId,
        customerId: user.customerId,
        orderId: orderId || orderItem[0]?.order_items?.orderId,
        rating,
        title,
        content,
        images,
        isVerified,
        isApproved: true, // Auto-approve for now
      }).returning();

      return reply.send({
        data: newReview[0],
        message: 'Review submitted successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create review' });
    }
  });

  // Get customer reviews
  fastify.get('/my-reviews', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { customerId: string };
    const { page = '1', limit = '10' } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      const reviewsList = await db.select({
        review: reviews,
        product: {
          id: products.id,
          titleEn: products.titleEn,
          images: products.images,
        },
      })
      .from(reviews)
      .innerJoin(products, eq(reviews.productId, products.id))
      .where(eq(reviews.customerId, user.customerId))
      .orderBy(desc(reviews.createdAt))
      .limit(Number(limit))
      .offset(offset);

      const totalCount = await db.select({ count: count() })
        .from(reviews)
        .where(eq(reviews.customerId, user.customerId));

      return reply.send({
        data: reviewsList.map(({ review, product }) => ({
          ...review,
          product,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / Number(limit)),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch reviews' });
    }
  });

  // Update review
  fastify.put('/:reviewId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const { reviewId } = request.params as { reviewId: string };
    const user = request.user as { customerId: string };
    const { rating, title, content } = request.body as any;

    try {
      await db.update(reviews)
        .set({
          rating,
          title,
          content,
          updatedAt: new Date(),
        })
        .where(and(
          eq(reviews.id, reviewId),
          eq(reviews.customerId, user.customerId)
        ));

      return reply.send({ message: 'Review updated successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update review' });
    }
  });

  // Delete review
  fastify.delete('/:reviewId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const { reviewId } = request.params as { reviewId: string };
    const user = request.user as { customerId: string };

    try {
      await db.delete(reviews)
        .where(and(
          eq(reviews.id, reviewId),
          eq(reviews.customerId, user.customerId)
        ));

      return reply.send({ message: 'Review deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete review' });
    }
  });

  // ========== ADMIN ROUTES ==========

  // Get all reviews for store
  fastify.get('/admin', {
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
    const { page = '1', limit = '20', status } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select({
        review: reviews,
        product: {
          titleEn: products.titleEn,
          images: products.images,
        },
        customer: {
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
        },
      })
      .from(reviews)
      .innerJoin(products, eq(reviews.productId, products.id))
      .leftJoin(customers, eq(reviews.customerId, customers.id))
      .where(eq(reviews.storeId, user.storeId));

      if (status === 'pending') {
        query = db.select({
          review: reviews,
          product: { titleEn: products.titleEn, images: products.images },
          customer: { firstName: customers.firstName, lastName: customers.lastName, email: customers.email },
        })
        .from(reviews)
        .innerJoin(products, eq(reviews.productId, products.id))
        .leftJoin(customers, eq(reviews.customerId, customers.id))
        .where(and(eq(reviews.storeId, user.storeId), eq(reviews.isApproved, false)));
      }

      const reviewsList = await query
        .orderBy(desc(reviews.createdAt))
        .limit(Number(limit))
        .offset(offset);

      const totalCount = await db.select({ count: count() })
        .from(reviews)
        .where(eq(reviews.storeId, user.storeId));

      return reply.send({
        data: reviewsList.map(({ review, product, customer }) => ({
          ...review,
          product,
          customer: customer?.firstName ? {
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
          } : null,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / Number(limit)),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch reviews' });
    }
  });

  // Approve/reject review
  fastify.put('/admin/:reviewId/approve', {
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
    const { reviewId } = request.params as { reviewId: string };
    const user = request.user as { storeId: string };
    const { isApproved } = request.body as any;

    try {
      await db.update(reviews)
        .set({ isApproved })
        .where(and(
          eq(reviews.id, reviewId),
          eq(reviews.storeId, user.storeId)
        ));

      return reply.send({ message: `Review ${isApproved ? 'approved' : 'rejected'}` });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update review' });
    }
  });

  // Respond to review
  fastify.post('/admin/:reviewId/respond', {
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
    const { reviewId } = request.params as { reviewId: string };
    const user = request.user as { storeId: string };
    const { response } = request.body as any;

    try {
      await db.update(reviews)
        .set({
          response,
          respondedAt: new Date(),
        })
        .where(and(
          eq(reviews.id, reviewId),
          eq(reviews.storeId, user.storeId)
        ));

      return reply.send({ message: 'Response added successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to add response' });
    }
  });

  // Delete review (admin)
  fastify.delete('/admin/:reviewId', {
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
    const { reviewId } = request.params as { reviewId: string };
    const user = request.user as { storeId: string };

    try {
      await db.delete(reviews)
        .where(and(
          eq(reviews.id, reviewId),
          eq(reviews.storeId, user.storeId)
        ));

      return reply.send({ message: 'Review deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete review' });
    }
  });
}
