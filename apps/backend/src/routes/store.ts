import { FastifyInstance } from 'fastify';
import { db, stores, products, categories, subcategories, modifierGroups, modifierOptions } from '../db/index.js';
import { eq, and, asc } from 'drizzle-orm';

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
  fastify.get('/:storeId/products', {
    config: { rateLimit: publicRateLimit }
  }, async (request, reply) => {
    const { storeId } = request.params as { storeId: string };

    // Security: Validate UUID format
    if (!isValidUUID(storeId)) {
      return reply.status(400).send({ error: 'Invalid store ID format' });
    }

    fastify.log.info(`Fetching products for store: ${storeId}`);

    try {
      const productsArr = await db.select()
        .from(products)
        .where(and(eq(products.storeId, storeId), eq(products.isPublished, true)));

      // Fetch modifiers for each product (with error handling for backwards compatibility)
      let productsWithModifiers: any[] = productsArr;
      try {
        productsWithModifiers = await Promise.all(
          productsArr.map(async (product) => {
            try {
              const groups = await db.select()
                .from(modifierGroups)
                .where(
                  and(
                    eq(modifierGroups.productId, product.id),
                    eq(modifierGroups.storeId, storeId)
                  )
                )
                .orderBy(asc(modifierGroups.sortOrder));

              const groupsWithOptions = await Promise.all(
                groups.map(async (group) => {
                  try {
                    const options = await db.select()
                      .from(modifierOptions)
                      .where(
                        and(
                          eq(modifierOptions.modifierGroupId, group.id),
                          eq(modifierOptions.isAvailable, true)
                        )
                      )
                      .orderBy(asc(modifierOptions.sortOrder));
                    return { ...group, options };
                  } catch (e) {
                    return { ...group, options: [] };
                  }
                })
              );

              return { ...product, modifierGroups: groupsWithOptions };
            } catch (e) {
              return { ...product, modifierGroups: [] };
            }
          })
        );
      } catch (e) {
        fastify.log.warn('Modifier tables not ready, returning products without modifiers');
      }

      fastify.log.info(`Found ${productsArr.length} products`);

      return reply.send({ data: productsWithModifiers });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // GET Single Product with Modifiers (Public)
  fastify.get('/:storeId/products/:productId', {
    config: { rateLimit: publicRateLimit }
  }, async (request, reply) => {
    const { storeId, productId } = request.params as { storeId: string; productId: string };

    // Security: Validate UUID format
    if (!isValidUUID(storeId) || !isValidUUID(productId)) {
      return reply.status(400).send({ error: 'Invalid ID format' });
    }

    try {
      const productArr = await db.select()
        .from(products)
        .where(
          and(
            eq(products.id, productId),
            eq(products.storeId, storeId),
            eq(products.isPublished, true)
          )
        )
        .limit(1);

      if (productArr.length === 0) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      const product = productArr[0];

      // Fetch modifier groups with options (with error handling for backwards compatibility)
      let groupsWithOptions: any[] = [];
      try {
        const groups = await db.select()
          .from(modifierGroups)
          .where(
            and(
              eq(modifierGroups.productId, productId),
              eq(modifierGroups.storeId, storeId)
            )
          )
          .orderBy(asc(modifierGroups.sortOrder));

        groupsWithOptions = await Promise.all(
          groups.map(async (group) => {
            try {
              const options = await db.select()
                .from(modifierOptions)
                .where(
                  and(
                    eq(modifierOptions.modifierGroupId, group.id),
                    eq(modifierOptions.isAvailable, true)
                  )
                )
                .orderBy(asc(modifierOptions.sortOrder));
              return { ...group, options };
            } catch (e) {
              return { ...group, options: [] };
            }
          })
        );
      } catch (e) {
        fastify.log.warn('Modifier tables not ready, returning product without modifiers');
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
  fastify.get('/:storeId/categories', {
    config: { rateLimit: publicRateLimit }
  }, async (request, reply) => {
    const { storeId } = request.params as { storeId: string };

    // Security: Validate UUID format
    if (!isValidUUID(storeId)) {
      return reply.status(400).send({ error: 'Invalid store ID format' });
    }
    
    fastify.log.info(`Fetching categories for store: ${storeId}`);
    
    try {
      const categoriesArr = await db.select()
        .from(categories)
        .where(eq(categories.storeId, storeId));
      
      fastify.log.info(`Found ${categoriesArr.length} categories`);
      
      return reply.send({ data: categoriesArr });
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
