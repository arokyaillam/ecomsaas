import { FastifyInstance } from 'fastify';
import { db, stores, products, categories, subcategories } from '../db/index.js';
import { eq, and } from 'drizzle-orm';

// Public route - no auth required
export default async function storeRoutes(fastify: FastifyInstance) {
  
  // GET Store by Domain (Public)
  fastify.get('/by-domain/:domain', async (request, reply) => {
    const { domain } = request.params as { domain: string };
    
    fastify.log.info(`Fetching store by domain: ${domain}`);
    
    try {
      const storeArr = await db.select()
        .from(stores)
        .where(eq(stores.domain, domain.toLowerCase()))
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
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // GET Store Products (Public)
  fastify.get('/:storeId/products', async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    
    fastify.log.info(`Fetching products for store: ${storeId}`);
    
    try {
      const productsArr = await db.select()
        .from(products)
        .where(and(eq(products.storeId, storeId), eq(products.isPublished, true)));
      
      fastify.log.info(`Found ${productsArr.length} products`);
      
      return reply.send({ data: productsArr });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // GET Store Categories (Public)
  fastify.get('/:storeId/categories', async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    
    fastify.log.info(`Fetching categories for store: ${storeId}`);
    
    try {
      const categoriesArr = await db.select()
        .from(categories)
        .where(eq(categories.storeId, storeId));
      
      fastify.log.info(`Found ${categoriesArr.length} categories`);
      
      return reply.send({ data: categoriesArr });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
  
  // GET Store Subcategories (Public)
  fastify.get('/:storeId/categories/:categoryId/subcategories', async (request, reply) => {
    const { storeId, categoryId } = request.params as { storeId: string, categoryId: string };
    
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
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
  // GET Store by ID
  fastify.get('/:storeId', async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    
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
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
