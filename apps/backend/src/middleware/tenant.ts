import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, stores } from '../db/index.js';

// Extend FastifyRequest to include tenantId
declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string;
  }
}

/**
 * Extract tenant_id from JWT or x-tenant-id header
 * Attach to request.tenantId
 * Reject if missing
 *
 * Security: If Authorization header is present with JWT, it MUST be valid.
 * Only fall back to x-tenant-id header if NO Authorization header is present.
 */
export async function requireTenant(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers['authorization'];
    const tenantFromHeader = request.headers['x-tenant-id'] as string | undefined;
    let tenantFromJwt: string | undefined;

    // If Authorization header is present, JWT MUST be valid - no fallback
    if (authHeader?.startsWith('Bearer ')) {
      try {
        await request.jwtVerify();
        const user = request.user as { storeId?: string };
        tenantFromJwt = user?.storeId;
      } catch (jwtError) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired JWT token',
        });
      }
    }

    // Determine tenantId: JWT takes precedence if present and valid, otherwise header
    const tenantId = tenantFromJwt || tenantFromHeader;

    if (!tenantId) {
      return reply.status(400).send({
        error: 'Tenant ID required',
        message: 'Provide tenant via JWT storeId or x-tenant-id header',
      });
    }

    // Validate tenant exists in database (security check)
    const storeArr = await db.select({ id: stores.id })
      .from(stores)
      .where(eq(stores.id, tenantId))
      .limit(1);

    if (storeArr.length === 0) {
      return reply.status(404).send({
        error: 'Invalid tenant',
        message: 'Store not found',
      });
    }

    // Attach to request
    request.tenantId = tenantId;
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

/**
 * Optional tenant extraction - attaches tenantId if available but doesn't reject
 */
export async function optionalTenant(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify().catch(() => {
      // Ignore JWT errors for optional tenant
    });

    const user = request.user as { storeId?: string };
    const tenantFromJwt = user?.storeId;
    const tenantFromHeader = request.headers['x-tenant-id'] as string | undefined;
    const tenantId = tenantFromJwt || tenantFromHeader;

    if (tenantId) {
      request.tenantId = tenantId;
    }
  } catch {
    // Continue without tenant
  }
}

/**
 * Helper function to wrap DB queries with tenant filter
 * Usage: withTenant(db.select().from(products), tenantId, eq(products.storeId, tenantId))
 *
 * OR use the simpler pattern:
 * db.select().from(products).where(eq(products.storeId, request.tenantId))
 */
export function withTenant<T extends { where: (...args: any[]) => any }>(
  query: T,
  tenantId: string,
  ...conditions: any[]
): T {
  // Combine existing where conditions with tenant filter
  if (conditions.length === 0) {
    return query;
  }
  if (conditions.length === 1) {
    return query.where(conditions[0]);
  }
  // For multiple conditions, use and()
  const { and } = require('drizzle-orm');
  return query.where(and(...conditions));
}

/**
 * Fastify plugin to add tenant-aware query helpers
 * This decorates the request with a db.query.withTenant helper
 */
export async function tenantQueryPlugin(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.tenantId) {
      // Store tenantId on request for easy access
      (request as any)._tenantId = request.tenantId;
    }
  });
}
