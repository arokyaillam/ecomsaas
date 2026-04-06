import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import bcrypt from 'bcrypt';
import { db, users, stores } from './db/index.js';
import { eq } from 'drizzle-orm';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';

const fastify = Fastify({ 
  logger: true,
  // Security: Disable powered by header
  disableRequestLogging: false
});

// Security: Add helmet for security headers
await fastify.register(helmet, {
  contentSecurityPolicy: false, // Disable for Swagger UI
  crossOriginEmbedderPolicy: false
});

// Security: Rate limiting for auth endpoints
await fastify.register(rateLimit, {
  max: 100, // Global limit
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({ error: 'Too many requests, please try again later' })
});

// Plugins Registration using await ensures Swagger is loaded before routes
await fastify.register(cors, { 
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://admin.ecomsaas.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true 
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

await fastify.register(jwt, { secret: JWT_SECRET });

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

// ------------------ SECURITY ------------------
// Rate limiting config for auth endpoints
const authRateLimit = {
  max: 5,
  timeWindow: '5 minutes',
  keyGenerator: (req: any) => req.ip || 'unknown'
};

// Input sanitization helper
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"']/g, '').slice(0, 255);
}

// ----------------------------------------------------
// 1. REGISTER API (Merchant & Store Creation)
// ----------------------------------------------------
fastify.post('/api/auth/register', {
  config: authRateLimit,
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
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  let { email, password, storeName, domain } = request.body as any;
  
  // Security: Sanitize inputs
  email = sanitizeInput(email).toLowerCase();
  storeName = sanitizeInput(storeName);
  domain = sanitizeInput(domain).toLowerCase().replace(/[^a-z0-9-]/g, '');

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
  config: authRateLimit,
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
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  let { email, password } = request.body as any;
  
  // Security: Sanitize inputs
  email = sanitizeInput(email).toLowerCase();
  password = password.trim();

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

// Register routes
await fastify.register(productRoutes, { prefix: '/api/products' });
await fastify.register(categoryRoutes, { prefix: '/api/categories' });

// Start the server
try {
  await fastify.listen({ port: 8000, host: '0.0.0.0' });
  console.log(`🚀 Server is running at http://localhost:8000`);
  console.log(`📑 Swagger Documentation available at http://localhost:8000/docs`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
