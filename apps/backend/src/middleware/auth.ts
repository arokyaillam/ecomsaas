import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Require a valid JWT for merchant/admin routes.
 * Sets request.user with userId, storeId, and role.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { storeId?: string };
    if (!user?.storeId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

/**
 * Require a valid JWT with optional authentication.
 * If token is present, sets request.user. If not, continues without error.
 */
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    // Not authenticated, continue as guest
  }
}

/**
 * Require a valid JWT with super admin role.
 */
export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { role?: string };
    if (user?.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'Forbidden: Super Admin access required' });
    }
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}