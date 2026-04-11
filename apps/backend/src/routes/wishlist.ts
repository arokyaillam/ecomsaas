import { FastifyInstance } from 'fastify';
import { db, wishlists, products } from '../db/index.js';
import { eq, and, desc } from 'drizzle-orm';

export default async function wishlistRoutes(fastify: FastifyInstance) {
  // Get customer's wishlist
  fastify.get('/', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { customerId: string };
    const { page = '1', limit = '20' } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      const wishlistItems = await db.select({
        wishlist: wishlists,
        product: products,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.customerId, user.customerId))
      .orderBy(desc(wishlists.createdAt))
      .limit(Number(limit))
      .offset(offset);

      return reply.send({
        data: wishlistItems.map(({ wishlist, product }) => ({
          id: wishlist.id,
          notes: wishlist.notes,
          addedAt: wishlist.createdAt,
          product: {
            id: product.id,
            titleEn: product.titleEn,
            titleAr: product.titleAr,
            images: product.images,
            salePrice: product.salePrice,
            currentQuantity: product.currentQuantity,
            isPublished: product.isPublished,
          },
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch wishlist' });
    }
  });

  // Add to wishlist
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
    const { productId, notes } = request.body as any;

    try {
      // Check if already in wishlist
      const existing = await db.select()
        .from(wishlists)
        .where(and(
          eq(wishlists.customerId, user.customerId),
          eq(wishlists.productId, productId)
        ))
        .limit(1);

      if (existing.length > 0) {
        return reply.status(400).send({ error: 'Product already in wishlist' });
      }

      const newItem = await db.insert(wishlists).values({
        storeId: user.storeId,
        customerId: user.customerId,
        productId,
        notes,
      }).returning();

      return reply.send({
        data: newItem[0],
        message: 'Added to wishlist',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to add to wishlist' });
    }
  });

  // Update wishlist item notes
  fastify.put('/:wishlistId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const { wishlistId } = request.params as { wishlistId: string };
    const user = request.user as { customerId: string };
    const { notes } = request.body as any;

    try {
      await db.update(wishlists)
        .set({ notes })
        .where(and(
          eq(wishlists.id, wishlistId),
          eq(wishlists.customerId, user.customerId)
        ));

      return reply.send({ message: 'Wishlist item updated' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update wishlist item' });
    }
  });

  // Remove from wishlist
  fastify.delete('/:wishlistId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const { wishlistId } = request.params as { wishlistId: string };
    const user = request.user as { customerId: string };

    try {
      await db.delete(wishlists)
        .where(and(
          eq(wishlists.id, wishlistId),
          eq(wishlists.customerId, user.customerId)
        ));

      return reply.send({ message: 'Removed from wishlist' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to remove from wishlist' });
    }
  });

  // Check if product is in wishlist
  fastify.get('/check/:productId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const user = request.user as { customerId: string };

    try {
      const existing = await db.select()
        .from(wishlists)
        .where(and(
          eq(wishlists.customerId, user.customerId),
          eq(wishlists.productId, productId)
        ))
        .limit(1);

      return reply.send({
        data: {
          isInWishlist: existing.length > 0,
          wishlistId: existing[0]?.id || null,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to check wishlist' });
    }
  });

  // Toggle wishlist (add if not exists, remove if exists)
  fastify.post('/toggle', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { customerId: string; storeId: string };
    const { productId } = request.body as any;

    try {
      const existing = await db.select()
        .from(wishlists)
        .where(and(
          eq(wishlists.customerId, user.customerId),
          eq(wishlists.productId, productId)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Remove from wishlist
        await db.delete(wishlists)
          .where(eq(wishlists.id, existing[0].id));
        return reply.send({ data: { isInWishlist: false }, message: 'Removed from wishlist' });
      } else {
        // Add to wishlist
        const newItem = await db.insert(wishlists).values({
          storeId: user.storeId,
          customerId: user.customerId,
          productId,
        }).returning();
        return reply.send({ data: { isInWishlist: true, id: newItem[0].id }, message: 'Added to wishlist' });
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to toggle wishlist' });
    }
  });
}
