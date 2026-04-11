import { FastifyInstance } from 'fastify';
import { db, customers, customerAddresses, orders, reviews } from '../db/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export default async function customerRoutes(fastify: FastifyInstance) {
  // Register customer
  fastify.post('/register', async (request, reply) => {
    const { storeId, email, password, firstName, lastName, phone } = request.body as any;

    try {
      // Check if email exists
      const existing = await db.select()
        .from(customers)
        .where(and(
          eq(customers.storeId, storeId),
          eq(customers.email, email.toLowerCase())
        ))
        .limit(1);

      if (existing.length > 0) {
        return reply.status(400).send({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create customer
      const newCustomer = await db.insert(customers).values({
        storeId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        isVerified: false,
      }).returning();

      const customer = newCustomer[0];

      // Generate JWT
      const token = fastify.jwt.sign({
        customerId: customer.id,
        storeId,
        email: customer.email,
      }, { expiresIn: '7d' });

      return reply.send({
        data: {
          token,
          customer: {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to register customer' });
    }
  });

  // Login customer
  fastify.post('/login', async (request, reply) => {
    const { storeId, email, password } = request.body as any;

    try {
      const customerArr = await db.select()
        .from(customers)
        .where(and(
          eq(customers.storeId, storeId),
          eq(customers.email, email.toLowerCase())
        ))
        .limit(1);

      if (customerArr.length === 0) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const customer = customerArr[0];

      const isValidPassword = await bcrypt.compare(password, customer.password);
      if (!isValidPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Update last login
      await db.update(customers)
        .set({ lastLoginAt: new Date() })
        .where(eq(customers.id, customer.id));

      // Generate JWT
      const token = fastify.jwt.sign({
        customerId: customer.id,
        storeId,
        email: customer.email,
      }, { expiresIn: '7d' });

      return reply.send({
        data: {
          token,
          customer: {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            avatarUrl: customer.avatarUrl,
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to login' });
    }
  });

  // Get customer profile
  fastify.get('/profile', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { customerId: string };

    try {
      const customerArr = await db.select()
        .from(customers)
        .where(eq(customers.id, user.customerId))
        .limit(1);

      if (customerArr.length === 0) {
        return reply.status(404).send({ error: 'Customer not found' });
      }

      const customer = customerArr[0];

      // Get addresses
      const addresses = await db.select()
        .from(customerAddresses)
        .where(eq(customerAddresses.customerId, user.customerId))
        .orderBy(desc(customerAddresses.isDefault));

      // Get order count
      const orderCount = await db.select({ count: orders.id })
        .from(orders)
        .where(eq(orders.customerId, user.customerId));

      // Get review count
      const reviewCount = await db.select({ count: reviews.id })
        .from(reviews)
        .where(eq(reviews.customerId, user.customerId));

      return reply.send({
        data: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          avatarUrl: customer.avatarUrl,
          marketingEmails: customer.marketingEmails,
          createdAt: customer.createdAt,
          addresses,
          stats: {
            orderCount: Number(orderCount[0]?.count || 0),
            reviewCount: Number(reviewCount[0]?.count || 0),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch profile' });
    }
  });

  // Update customer profile
  fastify.put('/profile', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { customerId: string };
    const { firstName, lastName, phone, marketingEmails } = request.body as any;

    try {
      await db.update(customers)
        .set({
          firstName,
          lastName,
          phone,
          marketingEmails,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, user.customerId));

      return reply.send({ message: 'Profile updated successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update profile' });
    }
  });

  // Change password
  fastify.put('/password', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { customerId: string };
    const { currentPassword, newPassword } = request.body as any;

    try {
      const customerArr = await db.select()
        .from(customers)
        .where(eq(customers.id, user.customerId))
        .limit(1);

      if (customerArr.length === 0) {
        return reply.status(404).send({ error: 'Customer not found' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, customerArr[0].password);
      if (!isValidPassword) {
        return reply.status(400).send({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.update(customers)
        .set({ password: hashedPassword })
        .where(eq(customers.id, user.customerId));

      return reply.send({ message: 'Password updated successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update password' });
    }
  });

  // ========== ADDRESSES ==========

  // Get customer addresses
  fastify.get('/addresses', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { customerId: string };

    try {
      const addresses = await db.select()
        .from(customerAddresses)
        .where(eq(customerAddresses.customerId, user.customerId))
        .orderBy(desc(customerAddresses.isDefault));

      return reply.send({ data: addresses });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch addresses' });
    }
  });

  // Add address
  fastify.post('/addresses', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { customerId: string; storeId: string };
    const addressData = request.body as any;

    try {
      // If this is the first address or marked as default, update others
      if (addressData.isDefault) {
        await db.update(customerAddresses)
          .set({ isDefault: false })
          .where(eq(customerAddresses.customerId, user.customerId));
      }

      const newAddress = await db.insert(customerAddresses).values({
        customerId: user.customerId,
        storeId: user.storeId,
        ...addressData,
      }).returning();

      return reply.send({
        data: newAddress[0],
        message: 'Address added successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to add address' });
    }
  });

  // Update address
  fastify.put('/addresses/:addressId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const { addressId } = request.params as { addressId: string };
    const user = request.user as { customerId: string };
    const addressData = request.body as any;

    try {
      // If setting as default, update others
      if (addressData.isDefault) {
        await db.update(customerAddresses)
          .set({ isDefault: false })
          .where(eq(customerAddresses.customerId, user.customerId));
      }

      await db.update(customerAddresses)
        .set({
          ...addressData,
          updatedAt: new Date(),
        })
        .where(and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, user.customerId)
        ));

      return reply.send({ message: 'Address updated successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update address' });
    }
  });

  // Delete address
  fastify.delete('/addresses/:addressId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const { addressId } = request.params as { addressId: string };
    const user = request.user as { customerId: string };

    try {
      await db.delete(customerAddresses)
        .where(and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, user.customerId)
        ));

      return reply.send({ message: 'Address deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete address' });
    }
  });

  // ========== ADMIN ROUTES ==========

  // Get all customers for store
  fastify.get('/admin', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { storeId?: string };
        if (!user?.storeId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const user = request.user as { storeId: string };
    const storeId = user.storeId;
    const { page = '1', limit = '20', search } = request.query as any;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(customers).where(eq(customers.storeId, storeId));

      // Search functionality
      if (search) {
        const searchLower = search.toLowerCase();
        query = db.select().from(customers).where(
          and(
            eq(customers.storeId, storeId),
            sql`(
              LOWER(${customers.email}) LIKE ${`%${searchLower}%`} OR
              LOWER(${customers.firstName}) LIKE ${`%${searchLower}%`} OR
              LOWER(${customers.lastName}) LIKE ${`%${searchLower}%`}
            )`
          )
        );
      }

      const customersList = await query
        .orderBy(desc(customers.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get order counts for each customer
      const customersWithStats = await Promise.all(
        customersList.map(async (customer) => {
          const orderCount = await db.select({ count: sql`count(*)` })
            .from(orders)
            .where(eq(orders.customerId, customer.id));

          const totalSpent = await db.select({
            total: sql`COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total::numeric ELSE 0 END), 0)`
          })
            .from(orders)
            .where(eq(orders.customerId, customer.id));

          return {
            ...customer,
            orderCount: Number(orderCount[0]?.count || 0),
            totalSpent: Number(totalSpent[0]?.total || 0),
          };
        })
      );

      const totalCount = await db.select({ count: sql`count(*)` })
        .from(customers)
        .where(eq(customers.storeId, storeId));

      return reply.send({
        data: customersWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / Number(limit)),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch customers' });
    }
  });

  // Get single customer (admin)
  fastify.get('/admin/:customerId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { storeId?: string };
        if (!user?.storeId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const { customerId } = request.params as { customerId: string };
    const user = request.user as { storeId: string };

    try {
      const customerArr = await db.select()
        .from(customers)
        .where(and(
          eq(customers.id, customerId),
          eq(customers.storeId, user.storeId)
        ))
        .limit(1);

      if (customerArr.length === 0) {
        return reply.status(404).send({ error: 'Customer not found' });
      }

      const customer = customerArr[0];

      // Get addresses
      const addresses = await db.select()
        .from(customerAddresses)
        .where(eq(customerAddresses.customerId, customerId))
        .orderBy(desc(customerAddresses.isDefault));

      // Get orders
      const customerOrders = await db.select()
        .from(orders)
        .where(eq(orders.customerId, customerId))
        .orderBy(desc(orders.createdAt))
        .limit(10);

      // Get stats
      const orderCount = await db.select({ count: sql`count(*)` })
        .from(orders)
        .where(eq(orders.customerId, customerId));

      const totalSpent = await db.select({
        total: sql`COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total::numeric ELSE 0 END), 0)`
      })
        .from(orders)
        .where(eq(orders.customerId, customerId));

      return reply.send({
        data: {
          ...customer,
          addresses,
          orders: customerOrders,
          stats: {
            orderCount: Number(orderCount[0]?.count || 0),
            totalSpent: Number(totalSpent[0]?.total || 0),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch customer' });
    }
  });
}
