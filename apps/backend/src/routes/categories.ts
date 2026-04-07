import { FastifyInstance } from 'fastify';
import { db, categories } from '../db/index.js';
import { eq, and } from 'drizzle-orm';

// Extend FastifyRequest for JWT user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      storeId: string;
      role: string;
    };
  }
}

export default async function categoryRoutes(fastify: FastifyInstance) {
  // Pre-handler hook to authenticate requests using JWT
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { storeId?: string };
      if (!user?.storeId) {
        return reply.status(401).send({ error: 'Invalid token: missing storeId. Please log in again.' });
      }
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // 1. GET ALL CATEGORIES
  fastify.get('/', async (request, reply) => {
    const { storeId } = request.user as { storeId: string; userId: string; role: string };
    
    try {
      const allCategories = await db.select().from(categories).where(eq(categories.storeId, storeId));
      return reply.send({ data: allCategories });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 2. GET CATEGORY BY ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params;

    try {
      const categoryArr = await db.select()
        .from(categories)
        .where(
          and(
            eq(categories.id, id),
            eq(categories.storeId, storeId)
          )
        ).limit(1);

      if (categoryArr.length === 0) {
        return reply.status(404).send({ error: 'Category not found' });
      }

      return reply.send({ data: categoryArr[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 3. CREATE CATEGORY
  fastify.post('/', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const categoryData = request.body as any;

    try {
      if (!categoryData.nameEn) {
        return reply.status(400).send({ error: 'nameEn is required' });
      }

      const newCategory = await db.insert(categories).values({
        ...categoryData,
        storeId,
      }).returning();

      return reply.status(201).send({ message: 'Category created', data: newCategory[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 4. UPDATE CATEGORY
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params;
    const categoryData = request.body as any;

    try {
      const updatedCategory = await db.update(categories)
        .set({ ...categoryData, updatedAt: new Date() })
        .where(
          and(
            eq(categories.id, id),
            eq(categories.storeId, storeId)
          )
        ).returning();

      if (updatedCategory.length === 0) {
        return reply.status(404).send({ error: 'Category not found' });
      }

      return reply.send({ message: 'Category updated', data: updatedCategory[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 5. DELETE CATEGORY
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params;

    try {
      // Ensure category exists and belongs to store
      const deletion = await db.delete(categories)
        .where(
          and(
            eq(categories.id, id),
            eq(categories.storeId, storeId)
          )
        ).returning({ id: categories.id });

      if (deletion.length === 0) {
        return reply.status(404).send({ error: 'Category not found' });
      }

      return reply.send({ message: 'Category deleted' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
