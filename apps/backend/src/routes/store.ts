import { FastifyInstance } from 'fastify';
import { db, stores, products, categories } from '../db/index.js';
import { eq } from 'drizzle-orm';

// Public route - no auth required
export default async function storeRoutes(fastify: FastifyInstance) {
  
  // GET Store by Domain (Public)
  fastify.get('/by-domain/:domain', async (request, reply) => {
    const { domain } = request.params as { domain: string };
    
    try {
      const storeArr = await db.select()
        .from(stores)
        .where(eq(stores.domain, domain.toLowerCase()))
        .limit(1);
      
      if (storeArr.length === 0) {
        return reply.status(404).send({ error: 'Store not found' });
      }

      const store = storeArr[0];
      
      // Return theme settings
      return reply.send({
        data: {
          id: store.id,
          name: store.name,
          domain: store.domain,
          currency: store.currency,
          language: store.language,
          theme: {
            primaryColor: store.primaryColor,
            secondaryColor: store.secondaryColor,
            accentColor: store.accentColor,
            backgroundColor: store.backgroundColor,
            surfaceColor: store.surfaceColor,
            textColor: store.textColor,
            textSecondaryColor: store.textSecondaryColor,
            borderColor: store.borderColor,
            borderRadius: store.borderRadius,
            fontFamily: store.fontFamily,
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
    
    try {
      const productsArr = await db.select()
        .from(products)
        .where(eq(products.storeId, storeId))
        .where(eq(products.isPublished, true));
      
      return reply.send({ data: productsArr });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // GET Store Categories (Public)
  fastify.get('/:storeId/categories', async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    
    try {
      const categoriesArr = await db.select()
        .from(categories)
        .where(eq(categories.storeId, storeId));
      
      return reply.send({ data: categoriesArr });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
