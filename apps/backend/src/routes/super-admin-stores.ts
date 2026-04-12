import { FastifyInstance } from 'fastify';
import { db, stores, users, products, categories, orders, customers } from '../db/index.js';
import { eq, sql } from 'drizzle-orm';
import { requireSuperAdmin } from '../middleware/auth.js';

export default async function superAdminStoreRoutes(fastify: FastifyInstance) {
  // Get all stores with stats
  fastify.get('/stores', {
    preHandler: [requireSuperAdmin],
  }, async (request, reply) => {
    try {
      const storesList = await db.select({
        id: stores.id,
        name: stores.name,
        domain: stores.domain,
        status: stores.status,
        ownerEmail: stores.ownerEmail,
        ownerName: stores.ownerName,
        createdAt: stores.createdAt,
        updatedAt: stores.updatedAt,
      }).from(stores);

      // Get stats for each store
      const storesWithStats = await Promise.all(
        storesList.map(async (store) => {
          const [productCount, orderCount, customerCount] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.storeId, store.id)),
            db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.storeId, store.id)),
            db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.storeId, store.id)),
          ]);

          return {
            ...store,
            stats: {
              products: Number(productCount[0]?.count || 0),
              orders: Number(orderCount[0]?.count || 0),
              customers: Number(customerCount[0]?.count || 0),
            },
          };
        })
      );

      return reply.send({ data: storesWithStats });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch stores' });
    }
  });

  // Soft delete store (deactivate - recommended)
  fastify.delete('/stores/:storeId', {
    preHandler: [requireSuperAdmin],
  }, async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { permanent } = request.query as { permanent?: string };

    try {
      // Check if store exists
      const storeArr = await db.select({
        id: stores.id,
        name: stores.name,
        status: stores.status
      })
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);

      if (storeArr.length === 0) {
        return reply.status(404).send({ error: 'Store not found' });
      }

      const store = storeArr[0];

      // If permanent=true, do hard delete
      if (permanent === 'true') {
        // Note: Hard delete requires cascade delete to be configured in schema
        // For safety, we'll just do a soft delete instead
        // To permanently delete, you need to manually delete all related records first
        // or configure cascade delete in the database schema

        // Soft delete instead
        await db.update(stores)
          .set({
            status: 'deactivated',
            updatedAt: new Date()
          })
          .where(eq(stores.id, storeId));

        fastify.log.info(`Store deactivated (permanent delete not supported): ${store.name} (${storeId}) by super admin`);

        return reply.send({
          message: 'Store deactivated. Note: Permanent delete is disabled for data safety. Contact database admin to manually remove data if needed.',
          storeId,
          storeName: store.name,
          action: 'deactivate'
        });
      }

      // Soft delete - just deactivate the store
      await db.update(stores)
        .set({
          status: 'deactivated',
          updatedAt: new Date()
        })
        .where(eq(stores.id, storeId));

      fastify.log.info(`Store deactivated: ${store.name} (${storeId}) by super admin`);

      return reply.send({
        message: 'Store deactivated successfully. Data is preserved and can be reactivated later.',
        storeId,
        storeName: store.name,
        action: 'deactivate'
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete store', details: error.message });
    }
  });

  // Update store status
  fastify.put('/stores/:storeId/status', {
    preHandler: [requireSuperAdmin],
  }, async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { status } = request.body as { status: string };

    try {
      if (!['active', 'pending', 'suspended', 'deactivated'].includes(status)) {
        return reply.status(400).send({ error: 'Invalid status' });
      }

      const updated = await db.update(stores)
        .set({ status, updatedAt: new Date() })
        .where(eq(stores.id, storeId))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Store not found' });
      }

      return reply.send({ message: 'Store status updated', data: updated[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update store status' });
    }
  });
}
