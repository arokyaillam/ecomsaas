import { FastifyInstance } from 'fastify';
import { db, products, categories, subcategories, modifierGroups, modifierOptions, productVariants, productVariantOptions, productVariantCombinations } from '../db/index.js';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';

const productSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional().nullable(),
  titleEn: z.string().min(1, "Title in English is required"),
  titleAr: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  preparationTime: z.coerce.number().int().optional().nullable(),
  tags: z.string().optional().nullable(),
  images: z.string().optional().nullable(),
  youtubeVideoLinkId: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  salePrice: z.coerce.string().min(1, "Sale price must be provided"),
  purchasePrice: z.coerce.string().optional().nullable(),
  purchaseLimit: z.coerce.number().int().optional().nullable(),
  barcode: z.string().optional().nullable(),
  discountType: z.string().optional(),
  discount: z.coerce.string().optional(),
  souqDealDiscount: z.coerce.string().optional().nullable(),
  currentQuantity: z.coerce.number().int().optional(),
  isPublished: z.boolean().optional()
});

export default async function productRoutes(fastify: FastifyInstance) {
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

  // 1. GET ALL PRODUCTS
  fastify.get('/', async (request, reply) => {
    const { storeId } = request.user as { storeId: string; userId: string; role: string };
    
    try {
      const allProducts = await db.select().from(products).where(eq(products.storeId, storeId));
      return reply.send({ data: allProducts });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 2. GET PRODUCT BY ID (with modifiers)
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params;

    try {
      const productArr = await db.select()
        .from(products)
        .where(
          and(
            eq(products.id, id),
            eq(products.storeId, storeId)
          )
        ).limit(1);

      if (productArr.length === 0) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      // Fetch modifier groups with options (product-specific and category-level)
      let groupsWithOptions: any[] = [];
      try {
        // Get product-specific modifiers
        const productGroups = await db.select()
          .from(modifierGroups)
          .where(
            and(
              eq(modifierGroups.productId, id),
              eq(modifierGroups.storeId, storeId),
              eq(modifierGroups.applyTo, 'product')
            )
          )
          .orderBy(asc(modifierGroups.sortOrder));

        // Get category-level modifiers
        const categoryGroups = await db.select()
          .from(modifierGroups)
          .where(
            and(
              eq(modifierGroups.categoryId, productArr[0].categoryId),
              eq(modifierGroups.storeId, storeId),
              eq(modifierGroups.applyTo, 'category')
            )
          )
          .orderBy(asc(modifierGroups.sortOrder));

        const allGroups = [...productGroups, ...categoryGroups];

        groupsWithOptions = await Promise.all(
          allGroups.map(async (group) => {
            try {
              const options = await db.select()
                .from(modifierOptions)
                .where(eq(modifierOptions.modifierGroupId, group.id))
                .orderBy(asc(modifierOptions.sortOrder));
              return { ...group, options };
            } catch (e) {
              return { ...group, options: [] };
            }
          })
        );
      } catch (e) {
        fastify.log.warn('Modifier tables query failed, returning product without modifiers');
      }

      // Fetch product variants with options
      let variantsWithOptions: any[] = [];
      try {
        const variants = await db.select()
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, id),
              eq(productVariants.storeId, storeId)
            )
          )
          .orderBy(asc(productVariants.sortOrder));

        variantsWithOptions = await Promise.all(
          variants.map(async (variant) => {
            try {
              const options = await db.select()
                .from(productVariantOptions)
                .where(eq(productVariantOptions.variantId, variant.id))
                .orderBy(asc(productVariantOptions.sortOrder));
              return { ...variant, options };
            } catch (e) {
              return { ...variant, options: [] };
            }
          })
        );
      } catch (e) {
        fastify.log.warn('Variant tables query failed, returning product without variants');
      }

      // Fetch variant combinations
      let variantCombinations: any[] = [];
      try {
        variantCombinations = await db.select()
          .from(productVariantCombinations)
          .where(
            and(
              eq(productVariantCombinations.productId, id),
              eq(productVariantCombinations.storeId, storeId)
            )
          )
          .orderBy(asc(productVariantCombinations.sku));
      } catch (e) {
        fastify.log.warn('Variant combinations query failed');
      }

      return reply.send({
        data: {
          ...productArr[0],
          modifierGroups: groupsWithOptions,
          variants: variantsWithOptions,
          variantCombinations: variantCombinations
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 3. CREATE PRODUCT
  fastify.post('/', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const productData = request.body as any;

    // Clean up empty strings to null for postgres compatibility
    for (const key of Object.keys(productData)) {
      if (productData[key] === '') {
        productData[key] = null;
      }
    }

    const parsed = productSchema.safeParse(productData);
    if (!parsed.success) {
      return reply.status(400).send({ error: { general: 'Validation failed', details: parsed.error.format() } });
    }
    const validData = parsed.data;

    try {
      const newProduct = await db.insert(products).values({
        ...validData,
        storeId,
      }).returning();

      return reply.status(201).send({ message: 'Product created', data: newProduct[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: { general: error.message || String(error) } });
    }
  });

  // 4. UPDATE PRODUCT
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params;
    const productData = request.body as any;

    // Clean up empty strings to null for postgres compatibility
    for (const key of Object.keys(productData)) {
      if (productData[key] === '') {
        productData[key] = null;
      }
    }

    const parsed = productSchema.partial().safeParse(productData);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.format() });
    }
    const validData = parsed.data;

    // Strip immutable system fields from the payload before applying to the database
    const payloadToUpdate = { ...validData } as any;
    delete payloadToUpdate.id;
    delete payloadToUpdate.storeId;
    delete payloadToUpdate.createdAt;
    delete payloadToUpdate.updatedAt;

    try {
      const updatedProduct = await db.update(products)
        .set({ ...payloadToUpdate, updatedAt: new Date() })
        .where(
          and(
            eq(products.id, id),
            eq(products.storeId, storeId)
          )
        ).returning();

      if (updatedProduct.length === 0) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      return reply.send({ message: 'Product updated', data: updatedProduct[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // 5. DELETE PRODUCT
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { storeId } = request.user as { storeId: string };
    const { id } = request.params;

    try {
      // Ensure product exists and belongs to store
      const deletion = await db.delete(products)
        .where(
          and(
            eq(products.id, id),
            eq(products.storeId, storeId)
          )
        ).returning({ id: products.id });

      if (deletion.length === 0) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      return reply.send({ message: 'Product deleted' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
