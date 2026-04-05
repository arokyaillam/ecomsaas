import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import bcrypt from 'bcrypt';
import { db, users, stores } from './db/index.js';
import { eq } from 'drizzle-orm';

const fastify = Fastify({ logger: true });

// Plugins Registration using await ensures Swagger is loaded before routes
await fastify.register(cors, { origin: '*' });

await fastify.register(jwt, { secret: 'super_secret_mnasati_key_123' });

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'EcomSaaS Backend API',
      description: 'API Documentation for Store and Merchant Management',
      version: '1.0.0'
    },
    servers: [{ url: 'http://localhost:8000' }]
  }
});

await fastify.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  }
});

// ----------------------------------------------------
// 1. REGISTER API (Merchant & Store Creation)
// ----------------------------------------------------
fastify.post('/api/auth/register', {
  schema: {
    tags: ['Auth'],
    summary: 'Register a new store and owner',
    body: {
      type: 'object',
      required: ['email', 'password', 'storeName', 'domain'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        storeName: { type: 'string' },
        domain: { type: 'string' }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          storeId: { type: 'string' }
        }
      },
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  const { email, password, storeName, domain } = request.body as any;

  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return reply.status(400).send({ error: 'Email already exists' });
    }

    const existingStore = await db.select().from(stores).where(eq(stores.domain, domain)).limit(1);
    if (existingStore.length > 0) {
      return reply.status(400).send({ error: 'Domain already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStore = await db.insert(stores).values({
      name: storeName,
      domain: domain,
    }).returning({ id: stores.id });

    const storeId = newStore[0].id;

    await db.insert(users).values({
      email: email,
      password: hashedPassword,
      role: 'OWNER',
      storeId: storeId,
    });

    return reply.status(201).send({ message: 'Store created successfully!', storeId });

  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ----------------------------------------------------
// 2. LOGIN API (Token Generation)
// ----------------------------------------------------
fastify.post('/api/auth/login', {
  schema: {
    tags: ['Auth'],
    summary: 'Login explicitly for merchants',
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          storeId: { type: 'string' }
        }
      },
      401: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  const { email, password } = request.body as any;

  try {
    const foundUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = foundUsers[0];

    if (!user) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = fastify.jwt.sign({ 
      userId: user.id, 
      storeId: user.storeId,
      role: user.role 
    });

    return reply.send({ token, storeId: user.storeId });

  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Start the server
try {
  await fastify.listen({ port: 8000, host: '0.0.0.0' });
  console.log(`🚀 Server is running at http://localhost:8000`);
  console.log(`📑 Swagger Documentation available at http://localhost:8000/docs`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
