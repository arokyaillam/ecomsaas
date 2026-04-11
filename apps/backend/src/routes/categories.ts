import { FastifyInstance } from 'fastify';
import { db, categories, subcategories } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const categorySchema = z.object({
  nameEn: z.string().min(1, "Name is required"),
  nameAr: z.string().optional().nullable()
});

const subcategorySchema = z.object({
  nameEn: z.string().min(1, "Name is required"),
  nameAr: z.string().optional().nullable()
});

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
    } catch (error: any) {
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
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 3. CREATE CATEGORY
  fastify.post('/', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    
    const parsed = categorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.format() });
    }
    const categoryData = parsed.data;

    try {
      const newCategory = await db.insert(categories).values({
        ...categoryData,
        storeId,
      }).returning();

      return reply.status(201).send({ message: 'Category created', data: newCategory[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 4. UPDATE CATEGORY
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params;

    const parsed = categorySchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.format() });
    }
    const categoryData = parsed.data;

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
    } catch (error: any) {
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
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // ----------------------------------------------------
  // SUBCATEGORY ROUTES (Nested under Categories)
  // ----------------------------------------------------

  // 6. GET ALL SUBCATEGORIES FOR A CATEGORY
  fastify.get<{ Params: { id: string } }>('/:id/subcategories', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params;

    try {
      const allSubcategories = await db.select()
        .from(subcategories)
        .where(
          and(
            eq(subcategories.categoryId, id),
            eq(subcategories.storeId, storeId)
          )
        );
      return reply.send({ data: allSubcategories });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 7. CREATE A SUBCATEGORY
  fastify.post<{ Params: { id: string } }>('/:id/subcategories', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params;

    const parsed = subcategorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.format() });
    }
    const subcatData = parsed.data;

    try {
      const newSubcategory = await db.insert(subcategories).values({
        nameEn: subcatData.nameEn,
        nameAr: subcatData.nameAr || null,
        categoryId: id,
        storeId: storeId,
      }).returning();

      return reply.status(201).send({ message: 'Subcategory created', data: newSubcategory[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 8. DELETE A SUBCATEGORY
  fastify.delete<{ Params: { id: string, subId: string } }>('/:id/subcategories/:subId', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { subId } = request.params;

    try {
      const deletion = await db.delete(subcategories)
        .where(
          and(
            eq(subcategories.id, subId),
            eq(subcategories.storeId, storeId)
          )
        ).returning({ id: subcategories.id });

      if (deletion.length === 0) {
        return reply.status(404).send({ error: 'Subcategory not found' });
      }

      return reply.send({ message: 'Subcategory deleted' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
