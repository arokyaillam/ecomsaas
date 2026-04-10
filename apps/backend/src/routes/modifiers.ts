import { FastifyInstance } from 'fastify';
import { db, modifierGroups, modifierOptions, products } from '../db/index.js';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const modifierGroupSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Name is required"),
  isRequired: z.boolean().default(false),
  minSelections: z.coerce.number().int().min(1).default(1),
  maxSelections: z.coerce.number().int().min(1).default(1),
  sortOrder: z.coerce.number().int().default(0)
});

const modifierOptionSchema = z.object({
  modifierGroupId: z.string().min(1, "Modifier group ID is required"),
  nameEn: z.string().min(1, "Name (English) is required"),
  nameAr: z.string().optional().nullable(),
  priceAdjustment: z.coerce.number().default(0),
  imageUrl: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isAvailable: z.boolean().default(true)
});

export default async function modifierRoutes(fastify: FastifyInstance) {
  // Pre-handler hook to authenticate requests
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { storeId?: string };
      if (!user?.storeId) {
        return reply.status(401).send({ error: 'Invalid token: missing storeId' });
      }
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // ==================== MODIFIER GROUPS ====================

  // GET /api/modifiers/product/:productId - Get all modifier groups for a product
  fastify.get('/product/:productId', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { productId } = request.params as { productId: string };

    try {
      // Get modifier groups with their options
      const groups = await db.select()
        .from(modifierGroups)
        .where(
          and(
            eq(modifierGroups.productId, productId),
            eq(modifierGroups.storeId, storeId)
          )
        )
        .orderBy(asc(modifierGroups.sortOrder));

      // Get options for each group
      const groupsWithOptions = await Promise.all(
        groups.map(async (group) => {
          const options = await db.select()
            .from(modifierOptions)
            .where(eq(modifierOptions.modifierGroupId, group.id))
            .orderBy(asc(modifierOptions.sortOrder));
          return { ...group, options };
        })
      );

      return reply.send({ data: groupsWithOptions });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // POST /api/modifiers/groups - Create modifier group
  fastify.post('/groups', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const groupData = request.body as any;

    const parsed = modifierGroupSchema.safeParse(groupData);
    if (!parsed.success) {
      return reply.status(400).send({ error: { general: 'Validation failed', details: parsed.error.format() } });
    }

    try {
      // Verify product belongs to store
      const productCheck = await db.select()
        .from(products)
        .where(
          and(
            eq(products.id, parsed.data.productId),
            eq(products.storeId, storeId)
          )
        )
        .limit(1);

      if (productCheck.length === 0) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      const newGroup = await db.insert(modifierGroups).values({
        ...parsed.data,
        storeId
      }).returning();

      return reply.status(201).send({
        message: 'Modifier group created',
        data: { ...newGroup[0], options: [] }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/modifiers/groups/:id - Update modifier group
  fastify.put('/groups/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };
    const groupData = request.body as any;

    const parsed = modifierGroupSchema.partial().safeParse(groupData);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.format() });
    }

    try {
      const updated = await db.update(modifierGroups)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(
          and(
            eq(modifierGroups.id, id),
            eq(modifierGroups.storeId, storeId)
          )
        )
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Modifier group not found' });
      }

      return reply.send({ message: 'Modifier group updated', data: updated[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // DELETE /api/modifiers/groups/:id - Delete modifier group
  fastify.delete('/groups/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };

    try {
      const deleted = await db.delete(modifierGroups)
        .where(
          and(
            eq(modifierGroups.id, id),
            eq(modifierGroups.storeId, storeId)
          )
        )
        .returning({ id: modifierGroups.id });

      if (deleted.length === 0) {
        return reply.status(404).send({ error: 'Modifier group not found' });
      }

      return reply.send({ message: 'Modifier group deleted' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // ==================== MODIFIER OPTIONS ====================

  // POST /api/modifiers/options - Create modifier option
  fastify.post('/options', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const optionData = request.body as any;

    const parsed = modifierOptionSchema.safeParse(optionData);
    if (!parsed.success) {
      return reply.status(400).send({ error: { general: 'Validation failed', details: parsed.error.format() } });
    }

    try {
      // Verify modifier group belongs to store
      const groupCheck = await db.select()
        .from(modifierGroups)
        .where(
          and(
            eq(modifierGroups.id, parsed.data.modifierGroupId),
            eq(modifierGroups.storeId, storeId)
          )
        )
        .limit(1);

      if (groupCheck.length === 0) {
        return reply.status(404).send({ error: 'Modifier group not found' });
      }

      const newOption = await db.insert(modifierOptions).values({
        ...parsed.data,
        storeId
      }).returning();

      return reply.status(201).send({
        message: 'Modifier option created',
        data: newOption[0]
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/modifiers/options/:id - Update modifier option
  fastify.put('/options/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };
    const optionData = request.body as any;

    const parsed = modifierOptionSchema.partial().safeParse(optionData);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.format() });
    }

    try {
      const updated = await db.update(modifierOptions)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(
          and(
            eq(modifierOptions.id, id),
            eq(modifierOptions.storeId, storeId)
          )
        )
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Modifier option not found' });
      }

      return reply.send({ message: 'Modifier option updated', data: updated[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // DELETE /api/modifiers/options/:id - Delete modifier option
  fastify.delete('/options/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };

    try {
      const deleted = await db.delete(modifierOptions)
        .where(
          and(
            eq(modifierOptions.id, id),
            eq(modifierOptions.storeId, storeId)
          )
        )
        .returning({ id: modifierOptions.id });

      if (deleted.length === 0) {
        return reply.status(404).send({ error: 'Modifier option not found' });
      }

      return reply.send({ message: 'Modifier option deleted' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
