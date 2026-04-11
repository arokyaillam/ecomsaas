import { FastifyInstance } from 'fastify';
import { db, modifierGroups, modifierOptions, products, categories, productVariants, productVariantOptions, productVariantCombinations } from '../db/index.js';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const modifierGroupSchema = z.object({
  productId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  applyTo: z.enum(['product', 'category']).default('product'),
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional().nullable(),
  isRequired: z.boolean().default(false),
  minSelections: z.coerce.number().int().min(0).default(1),
  maxSelections: z.coerce.number().int().min(1).default(1),
  sortOrder: z.coerce.number().int().default(0)
}).refine(data => {
  // Either productId or categoryId must be provided based on applyTo
  if (data.applyTo === 'product') return !!data.productId;
  if (data.applyTo === 'category') return !!data.categoryId;
  return false;
}, {
  message: "productId is required when applyTo is 'product', categoryId is required when applyTo is 'category'"
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

// Product Variant Schemas
const productVariantSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  nameEn: z.string().min(1, "Name (English) is required"),
  nameAr: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0)
});

const productVariantOptionSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  nameEn: z.string().min(1, "Name (English) is required"),
  nameAr: z.string().optional().nullable(),
  priceAdjustment: z.coerce.number().default(0),
  sku: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().int().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isAvailable: z.boolean().default(true)
});

const variantCombinationSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  sku: z.string().min(1, "SKU is required"),
  combinationKey: z.string().min(1, "Combination key is required"),
  priceAdjustment: z.coerce.number().default(0),
  stockQuantity: z.coerce.number().int().default(0),
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
      // Get product-specific modifier groups
      const productGroups = await db.select()
        .from(modifierGroups)
        .where(
          and(
            eq(modifierGroups.productId, productId),
            eq(modifierGroups.storeId, storeId),
            eq(modifierGroups.applyTo, 'product')
          )
        )
        .orderBy(asc(modifierGroups.sortOrder));

      // Get the product to find its category
      const product = await db.select({ categoryId: products.categoryId })
        .from(products)
        .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
        .limit(1);

      let categoryGroups: any[] = [];
      if (product.length > 0 && product[0].categoryId) {
        // Get category-level modifier groups
        categoryGroups = await db.select()
          .from(modifierGroups)
          .where(
            and(
              eq(modifierGroups.categoryId, product[0].categoryId),
              eq(modifierGroups.storeId, storeId),
              eq(modifierGroups.applyTo, 'category')
            )
          )
          .orderBy(asc(modifierGroups.sortOrder));
      }

      // Combine product and category groups
      const allGroups = [...productGroups, ...categoryGroups];

      // Get options for each group
      const groupsWithOptions = await Promise.all(
        allGroups.map(async (group) => {
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

  // GET /api/modifiers/category/:categoryId - Get all modifier groups for a category
  fastify.get('/category/:categoryId', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { categoryId } = request.params as { categoryId: string };

    try {
      const groups = await db.select()
        .from(modifierGroups)
        .where(
          and(
            eq(modifierGroups.categoryId, categoryId),
            eq(modifierGroups.storeId, storeId),
            eq(modifierGroups.applyTo, 'category')
          )
        )
        .orderBy(asc(modifierGroups.sortOrder));

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
      // Verify product/category belongs to store
      if (parsed.data.applyTo === 'product' && parsed.data.productId) {
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
      } else if (parsed.data.applyTo === 'category' && parsed.data.categoryId) {
        const categoryCheck = await db.select()
          .from(categories)
          .where(
            and(
              eq(categories.id, parsed.data.categoryId),
              eq(categories.storeId, storeId)
            )
          )
          .limit(1);

        if (categoryCheck.length === 0) {
          return reply.status(404).send({ error: 'Category not found' });
        }
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
        storeId,
        priceAdjustment: String(parsed.data.priceAdjustment || 0)
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
      const updateData: any = { ...parsed.data, updatedAt: new Date() };
      if (updateData.priceAdjustment !== undefined) {
        updateData.priceAdjustment = String(updateData.priceAdjustment);
      }
      const updated = await db.update(modifierOptions)
        .set(updateData)
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

  // ==================== PRODUCT VARIANTS ====================

  // GET /api/modifiers/variants/product/:productId - Get all variants for a product
  fastify.get('/variants/product/:productId', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { productId } = request.params as { productId: string };

    try {
      const variants = await db.select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, productId),
            eq(productVariants.storeId, storeId)
          )
        )
        .orderBy(asc(productVariants.sortOrder));

      const variantsWithOptions = await Promise.all(
        variants.map(async (variant) => {
          const options = await db.select()
            .from(productVariantOptions)
            .where(eq(productVariantOptions.variantId, variant.id))
            .orderBy(asc(productVariantOptions.sortOrder));
          return { ...variant, options };
        })
      );

      return reply.send({ data: variantsWithOptions });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // POST /api/modifiers/variants - Create product variant
  fastify.post('/variants', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const variantData = request.body as any;

    const parsed = productVariantSchema.safeParse(variantData);
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

      const newVariant = await db.insert(productVariants).values({
        ...parsed.data,
        storeId
      }).returning();

      return reply.status(201).send({
        message: 'Product variant created',
        data: { ...newVariant[0], options: [] }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/modifiers/variants/:id - Update product variant
  fastify.put('/variants/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };
    const variantData = request.body as any;

    const parsed = productVariantSchema.partial().safeParse(variantData);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.format() });
    }

    try {
      const updated = await db.update(productVariants)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(
          and(
            eq(productVariants.id, id),
            eq(productVariants.storeId, storeId)
          )
        )
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Product variant not found' });
      }

      return reply.send({ message: 'Product variant updated', data: updated[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // DELETE /api/modifiers/variants/:id - Delete product variant
  fastify.delete('/variants/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };

    try {
      const deleted = await db.delete(productVariants)
        .where(
          and(
            eq(productVariants.id, id),
            eq(productVariants.storeId, storeId)
          )
        )
        .returning({ id: productVariants.id });

      if (deleted.length === 0) {
        return reply.status(404).send({ error: 'Product variant not found' });
      }

      return reply.send({ message: 'Product variant deleted' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // ==================== PRODUCT VARIANT OPTIONS ====================

  // POST /api/modifiers/variants/options - Create variant option
  fastify.post('/variants/options', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const optionData = request.body as any;

    const parsed = productVariantOptionSchema.safeParse(optionData);
    if (!parsed.success) {
      return reply.status(400).send({ error: { general: 'Validation failed', details: parsed.error.format() } });
    }

    try {
      // Verify variant belongs to store
      const variantCheck = await db.select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.id, parsed.data.variantId),
            eq(productVariants.storeId, storeId)
          )
        )
        .limit(1);

      if (variantCheck.length === 0) {
        return reply.status(404).send({ error: 'Product variant not found' });
      }

      const newOption = await db.insert(productVariantOptions).values({
        ...parsed.data,
        storeId,
        priceAdjustment: String(parsed.data.priceAdjustment || 0)
      }).returning();

      return reply.status(201).send({
        message: 'Variant option created',
        data: newOption[0]
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/modifiers/variants/options/:id - Update variant option
  fastify.put('/variants/options/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };
    const optionData = request.body as any;

    const parsed = productVariantOptionSchema.partial().safeParse(optionData);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.format() });
    }

    try {
      const updateData: any = { ...parsed.data, updatedAt: new Date() };
      if (updateData.priceAdjustment !== undefined) {
        updateData.priceAdjustment = String(updateData.priceAdjustment);
      }
      const updated = await db.update(productVariantOptions)
        .set(updateData)
        .where(
          and(
            eq(productVariantOptions.id, id),
            eq(productVariantOptions.storeId, storeId)
          )
        )
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Variant option not found' });
      }

      return reply.send({ message: 'Variant option updated', data: updated[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // DELETE /api/modifiers/variants/options/:id - Delete variant option
  fastify.delete('/variants/options/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };

    try {
      const deleted = await db.delete(productVariantOptions)
        .where(
          and(
            eq(productVariantOptions.id, id),
            eq(productVariantOptions.storeId, storeId)
          )
        )
        .returning({ id: productVariantOptions.id });

      if (deleted.length === 0) {
        return reply.status(404).send({ error: 'Variant option not found' });
      }

      return reply.send({ message: 'Variant option deleted' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // ==================== VARIANT COMBINATIONS ====================

  // GET /api/modifiers/combinations/product/:productId - Get all variant combinations
  fastify.get('/combinations/product/:productId', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { productId } = request.params as { productId: string };

    try {
      const combinations = await db.select()
        .from(productVariantCombinations)
        .where(
          and(
            eq(productVariantCombinations.productId, productId),
            eq(productVariantCombinations.storeId, storeId)
          )
        )
        .orderBy(asc(productVariantCombinations.sku));

      return reply.send({ data: combinations });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // POST /api/modifiers/combinations - Create variant combination
  fastify.post('/combinations', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const combinationData = request.body as any;

    const parsed = variantCombinationSchema.safeParse(combinationData);
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

      const newCombination = await db.insert(productVariantCombinations).values({
        ...parsed.data,
        storeId
      }).returning();

      return reply.status(201).send({
        message: 'Variant combination created',
        data: newCombination[0]
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/modifiers/combinations/:id - Update variant combination
  fastify.put('/combinations/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };
    const combinationData = request.body as any;

    const parsed = variantCombinationSchema.partial().safeParse(combinationData);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.format() });
    }

    try {
      const updateData: any = { ...parsed.data, updatedAt: new Date() };
      if (updateData.priceAdjustment !== undefined) {
        updateData.priceAdjustment = String(updateData.priceAdjustment);
      }
      const updated = await db.update(productVariantCombinations)
        .set(updateData)
        .where(
          and(
            eq(productVariantCombinations.id, id),
            eq(productVariantCombinations.storeId, storeId)
          )
        )
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Variant combination not found' });
      }

      return reply.send({ message: 'Variant combination updated', data: updated[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // DELETE /api/modifiers/combinations/:id - Delete variant combination
  fastify.delete('/combinations/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params as { id: string };

    try {
      const deleted = await db.delete(productVariantCombinations)
        .where(
          and(
            eq(productVariantCombinations.id, id),
            eq(productVariantCombinations.storeId, storeId)
          )
        )
        .returning({ id: productVariantCombinations.id });

      if (deleted.length === 0) {
        return reply.status(404).send({ error: 'Variant combination not found' });
      }

      return reply.send({ message: 'Variant combination deleted' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
