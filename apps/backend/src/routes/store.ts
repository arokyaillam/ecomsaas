import { FastifyInstance } from 'fastify';
import { db, stores, products, categories, subcategories, modifierGroups, modifierOptions } from '../db/index.js';
import { eq, and, asc, sql } from 'drizzle-orm';

// Public route - no auth required
export default async function storeRoutes(fastify: FastifyInstance) {

  // Rate limit configuration for public endpoints
  const publicRateLimit = {
    max: 60,
    timeWindow: '1 minute',
    keyGenerator: (req: any) => req.ip || 'unknown',
    errorResponseBuilder: () => ({ error: 'Too many requests, please try again later' })
  };

  // Security: UUID validation helper
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };
  
  // GET Store by Domain (Public)
  fastify.get('/by-domain/:domain', {
    config: { rateLimit: publicRateLimit }
  }, async (request, reply) => {
    const { domain } = request.params as { domain: string };

    // Security: Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    const sanitizedDomain = domain.toLowerCase().trim();

    if (!domainRegex.test(sanitizedDomain) && !sanitizedDomain.match(/^[a-z0-9-]+$/)) {
      return reply.status(400).send({ error: 'Invalid domain format' });
    }

    fastify.log.info(`Fetching store by domain: ${sanitizedDomain}`);

    try {
      const storeArr = await db.select()
        .from(stores)
        .where(eq(stores.domain, sanitizedDomain))
        .limit(1);
      
      fastify.log.info(`Found ${storeArr.length} stores`);
      
      if (storeArr.length === 0) {
        return reply.status(404).send({ error: 'Store not found' });
      }

      const store = storeArr[0];
      
      fastify.log.info(`Store found: ${store.name}, theme available: ${!!store.primaryColor}`);
      
      // Return theme settings
      return reply.send({
        data: {
          id: store.id,
          name: store.name,
          domain: store.domain,
          currency: store.currency,
          language: store.language,
          theme: {
            primaryColor: store.primaryColor || '#0ea5e9',
            secondaryColor: store.secondaryColor || '#6366f1',
            accentColor: store.accentColor || '#8b5cf6',
            backgroundColor: store.backgroundColor || '#0f172a',
            surfaceColor: store.surfaceColor || '#1e293b',
            textColor: store.textColor || '#f8fafc',
            textSecondaryColor: store.textSecondaryColor || '#94a3b8',
            borderColor: store.borderColor || 'rgba(255,255,255,0.1)',
            borderRadius: store.borderRadius || '12px',
            fontFamily: store.fontFamily || 'Inter, sans-serif',
            logoUrl: store.logoUrl,
            faviconUrl: store.faviconUrl,
          },
          hero: {
            image: store.heroImage,
            title: store.heroTitle || 'Welcome to Our Store',
            subtitle: store.heroSubtitle || 'Discover amazing products at great prices',
            ctaText: store.heroCtaText || 'Explore Collection',
            ctaLink: store.heroCtaLink || '#products',
            enabled: store.heroEnabled ?? true
          }
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // GET Store Products (Public)
  // FIXED: Single JOIN query instead of N+1 loops + Pagination
  fastify.get('/:storeId/products', {
    config: { rateLimit: publicRateLimit }
  }, async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { page = '1', limit = '20', categoryId } = request.query as { page?: string; limit?: string; categoryId?: string };

    // Security: Validate UUID format
    if (!isValidUUID(storeId)) {
      return reply.status(400).send({ error: 'Invalid store ID format' });
    }

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    fastify.log.info(`Fetching products for store: ${storeId}, page: ${pageNum}, limit: ${limitNum}`);

    try {
      // Build where conditions
      let whereConditions = and(
        eq(products.storeId, storeId),
        eq(products.isPublished, true)
      );

      if (categoryId && isValidUUID(categoryId)) {
        whereConditions = and(
          eq(products.storeId, storeId),
          eq(products.isPublished, true),
          eq(products.categoryId, categoryId)
        ) as any;
      }

      // Get total count for pagination
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereConditions);
      const totalCount = Number(countResult[0]?.count || 0);

      // Single query with LEFT JOINs to fetch products with modifiers (paginated)
      const results = await db.select({
        product: products,
        group: modifierGroups,
        option: modifierOptions,
      })
        .from(products)
        .leftJoin(modifierGroups, eq(modifierGroups.productId, products.id))
        .leftJoin(modifierOptions, eq(modifierOptions.modifierGroupId, modifierGroups.id))
        .where(whereConditions)
        .orderBy(
          asc(products.sortOrder),
          asc(modifierGroups.sortOrder),
          asc(modifierOptions.sortOrder)
        )
        .limit(limitNum)
        .offset(offset);

      // Aggregate results into products with nested modifiers
      const productMap = new Map<string, any>();

      for (const row of results) {
        const product = row.product;
        const group = row.group;
        const option = row.option;

        if (!productMap.has(product.id)) {
          productMap.set(product.id, {
            ...product,
            modifierGroups: [] as any[],
            groupMap: new Map<string, any>() // Temporary for grouping
          });
        }

        const productData = productMap.get(product.id);

        if (group && !productData.groupMap.has(group.id)) {
          const groupWithOptions = { ...group, options: [] as any[] };
          productData.groupMap.set(group.id, groupWithOptions);
          productData.modifierGroups.push(groupWithOptions);
        }

        if (group && option && option.isAvailable) {
          const groupData = productData.groupMap.get(group.id);
          if (groupData) {
            groupData.options.push(option);
          }
        }
      }

      // Clean up temporary maps
      const productsWithModifiers = Array.from(productMap.values()).map(p => {
        const { groupMap, ...product } = p;
        return product;
      });

      fastify.log.info(`Found ${productsWithModifiers.length} products (total: ${totalCount})`);

      return reply.send({
        data: productsWithModifiers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          hasNextPage: pageNum * limitNum < totalCount,
          hasPrevPage: pageNum > 1
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // GET Single Product with Modifiers (Public)
  // FIXED: Single JOIN query instead of N+1 loops
  fastify.get('/:storeId/products/:productId', {
    config: { rateLimit: publicRateLimit }
  }, async (request, reply) => {
    const { storeId, productId } = request.params as { storeId: string; productId: string };

    // Security: Validate UUID format
    if (!isValidUUID(storeId) || !isValidUUID(productId)) {
      return reply.status(400).send({ error: 'Invalid ID format' });
    }

    try {
      // Single query with LEFT JOINs
      const results = await db.select({
        product: products,
        group: modifierGroups,
        option: modifierOptions,
      })
        .from(products)
        .leftJoin(modifierGroups, eq(modifierGroups.productId, products.id))
        .leftJoin(modifierOptions, eq(modifierOptions.modifierGroupId, modifierGroups.id))
        .where(and(
          eq(products.id, productId),
          eq(products.storeId, storeId),
          eq(products.isPublished, true)
        ))
        .orderBy(
          asc(modifierGroups.sortOrder),
          asc(modifierOptions.sortOrder)
        );

      if (results.length === 0) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      // Aggregate into product with nested modifiers
      const product = results[0].product;
      const groupMap = new Map<string, any>();
      const groupsWithOptions: any[] = [];

      for (const row of results) {
        const group = row.group;
        const option = row.option;

        if (group && !groupMap.has(group.id)) {
          const groupWithOptions = { ...group, options: [] as any[] };
          groupMap.set(group.id, groupWithOptions);
          groupsWithOptions.push(groupWithOptions);
        }

        if (group && option && option.isAvailable) {
          const groupData = groupMap.get(group.id);
          if (groupData) {
            groupData.options.push(option);
          }
        }
      }

      return reply.send({
        data: {
          ...product,
          modifierGroups: groupsWithOptions
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // GET Store Categories (Public)
  // FIXED: Added pagination
  fastify.get('/:storeId/categories', {
    config: { rateLimit: publicRateLimit }
  }, async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { page = '1', limit = '50' } = request.query as { page?: string; limit?: string };

    // Security: Validate UUID format
    if (!isValidUUID(storeId)) {
      return reply.status(400).send({ error: 'Invalid store ID format' });
    }

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    fastify.log.info(`Fetching categories for store: ${storeId}`);

    try {
      // Get total count
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(categories)
        .where(eq(categories.storeId, storeId));
      const totalCount = Number(countResult[0]?.count || 0);

      const categoriesArr = await db.select()
        .from(categories)
        .where(eq(categories.storeId, storeId))
        .limit(limitNum)
        .offset(offset);

      fastify.log.info(`Found ${categoriesArr.length} categories (total: ${totalCount})`);

      return reply.send({
        data: categoriesArr,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          hasNextPage: pageNum * limitNum < totalCount,
          hasPrevPage: pageNum > 1
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
  
  // GET Store Subcategories (Public)
  fastify.get('/:storeId/categories/:categoryId/subcategories', {
    config: { rateLimit: publicRateLimit }
  }, async (request, reply) => {
    const { storeId, categoryId } = request.params as { storeId: string, categoryId: string };

    // Security: Validate UUID format
    if (!isValidUUID(storeId) || !isValidUUID(categoryId)) {
      return reply.status(400).send({ error: 'Invalid ID format' });
    }
    
    fastify.log.info(`Fetching subcategories for store: ${storeId}, category: ${categoryId}`);
    
    try {
      const subcategoriesArr = await db.select()
        .from(subcategories)
        .where(
          and(
            eq(subcategories.storeId, storeId),
            eq(subcategories.categoryId, categoryId)
          )
        );
      
      fastify.log.info(`Found ${subcategoriesArr.length} subcategories`);
      
      return reply.send({ data: subcategoriesArr });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
  // GET Store by ID (Public)
  fastify.get('/:storeId', {
    config: { rateLimit: publicRateLimit }
  }, async (request, reply) => {
    const { storeId } = request.params as { storeId: string };

    // Security: Validate UUID format
    if (!isValidUUID(storeId)) {
      return reply.status(400).send({ error: 'Invalid store ID format' });
    }
    
    fastify.log.info(`Fetching store by ID: ${storeId}`);
    
    try {
      const storeArr = await db.select()
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);
      
      if (storeArr.length === 0) {
        return reply.status(404).send({ error: 'Store not found' });
      }

      const store = storeArr[0];

      return reply.send({
        data: {
          id: store.id,
          name: store.name,
          domain: store.domain,
          currency: store.currency,
          language: store.language,
          theme: {
            primaryColor: store.primaryColor || '#0ea5e9',
            secondaryColor: store.secondaryColor || '#6366f1',
            accentColor: store.accentColor || '#8b5cf6',
            backgroundColor: store.backgroundColor || '#0f172a',
            surfaceColor: store.surfaceColor || '#1e293b',
            textColor: store.textColor || '#f8fafc',
            textSecondaryColor: store.textSecondaryColor || '#94a3b8',
            borderColor: store.borderColor || 'rgba(255,255,255,0.1)',
            borderRadius: store.borderRadius || '12px',
            fontFamily: store.fontFamily || 'Inter, sans-serif',
            logoUrl: store.logoUrl,
            faviconUrl: store.faviconUrl,
          },
          hero: {
            image: store.heroImage,
            title: store.heroTitle || 'Welcome to Our Store',
            subtitle: store.heroSubtitle || 'Discover amazing products at great prices',
            ctaText: store.heroCtaText || 'Explore Collection',
            ctaLink: store.heroCtaLink || '#products',
            enabled: store.heroEnabled ?? true
          }
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
