import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import cookie from '@fastify/cookie';
import bcrypt from 'bcrypt';
import { db, users, stores } from './db/index.js';
import { eq } from 'drizzle-orm';
import { join } from 'path';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import storeRoutes from './routes/store.js';
import uploadRoutes from './routes/upload.js';
import modifierRoutes from './routes/modifiers.js';
import cartRoutes from './routes/cart.js';
import checkoutRoutes from './routes/checkout.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import reviewRoutes from './routes/reviews.js';
import couponRoutes from './routes/coupons.js';
import wishlistRoutes from './routes/wishlist.js';
import analyticsRoutes from './routes/analytics.js';
import superAdminRoutes from './routes/super-admin.js';

// Type declarations for JWT
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId?: string;
      customerId?: string;
      storeId: string;
      role?: string;
      email?: string;
    };
    user: {
      userId?: string;
      customerId?: string;
      storeId: string;
      role?: string;
      email?: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId?: string;
      customerId?: string;
      storeId: string;
      role?: string;
      email?: string;
    };
  }
}

const fastify = Fastify({
  logger: true,
  // Security: Disable powered by header
  disableRequestLogging: false,
  // Security: Only trust proxies from specific IPs (comma-separated in env var)
  trustProxy: process.env.TRUSTED_PROXIES
    ? process.env.TRUSTED_PROXIES.split(',').map(ip => ip.trim())
    : ['127.0.0.1', '::1'] // Default to localhost only
});

// Security: Add helmet for security headers
await fastify.register(helmet, {
  contentSecurityPolicy: false, // Disable for Swagger UI
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
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
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  strictPreflight: false
});

// Cookie support for cart sessions
await fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'my-secret-cookie-key-change-in-production',
  parseOptions: {}
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
  },
  uiHooks: {
    onRequest: function (request, reply, next) {
      const b64auth = (request.headers.authorization || '').split(' ')[1] || '';
      const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      const swaggerUser = process.env.SWAGGER_USER || 'admin';
      const swaggerPass = process.env.SWAGGER_PASS || 'changeme';
      if (login === swaggerUser && password === swaggerPass) {
        return next();
      }
      reply.header('WWW-Authenticate', 'Basic realm="Swagger Docs"');
      reply.code(401).send();
    }
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

  } catch (error: any) {
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
    }, { expiresIn: '7d' });

    return reply.send({ token, storeId: user.storeId });

  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ----------------------------------------------------
// 3. UPDATE STORE THEME API (Protected)
// ----------------------------------------------------
fastify.put('/api/store/theme', {
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
  schema: {
    tags: ['Store'],
    summary: 'Update store theme settings',
    body: {
      type: 'object',
      properties: {
        primaryColor: { type: 'string' },
        secondaryColor: { type: 'string' },
        accentColor: { type: 'string' },
        backgroundColor: { type: 'string' },
        surfaceColor: { type: 'string' },
        textColor: { type: 'string' },
        textSecondaryColor: { type: 'string' },
        borderColor: { type: 'string' },
        borderRadius: { type: 'string' },
        fontFamily: { type: 'string' },
        logoUrl: { type: 'string' },
        faviconUrl: { type: 'string' },
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          data: { type: 'object' }
        }
      },
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' }
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
  const { storeId } = request.user as { storeId: string };
  const themeData = request.body as any;
  
  // Security: Theme update allowlist & sanitize CSS
  const allowedThemeFields = [
    'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 
    'surfaceColor', 'textColor', 'textSecondaryColor', 'borderColor', 
    'borderRadius', 'fontFamily', 'logoUrl', 'faviconUrl'
  ];
  
  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Allow null/empty
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const sanitizedThemeData: any = {};
  for (const field of allowedThemeFields) {
    if (themeData[field] !== undefined && typeof themeData[field] === 'string') {
      const val = themeData[field].trim();
      // Basic sanitization
      const sanitized = val.replace(/[<>'"\\\\]/g, '').slice(0, 500);

      // Validate URLs for logoUrl and faviconUrl fields
      if ((field === 'logoUrl' || field === 'faviconUrl') && !isValidUrl(sanitized)) {
        return reply.code(400).send({ error: `Invalid URL for ${field}` });
      }

      sanitizedThemeData[field] = sanitized;
    }
  }

  try {
    const updatedStore = await db.update(stores)
      .set({
        ...sanitizedThemeData,
        updatedAt: new Date()
      })
      .where(eq(stores.id, storeId))
      .returning();
    
    return reply.send({ 
      message: 'Theme updated successfully',
      data: updatedStore[0]
    });
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ----------------------------------------------------
// 4. UPDATE STORE HERO API (Protected)
// ----------------------------------------------------
fastify.put('/api/store/hero', {
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
  schema: {
    tags: ['Store'],
    summary: 'Update store hero section',
    body: {
      type: 'object',
      properties: {
        heroImage: { type: 'string' },
        heroTitle: { type: 'string' },
        heroSubtitle: { type: 'string' },
        heroCtaText: { type: 'string' },
        heroCtaLink: { type: 'string' },
        heroEnabled: { type: 'boolean' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          data: { type: 'object' }
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
  const { storeId } = request.user as { storeId: string };
  const heroData = request.body as any;

  // Security: Allowlist for hero fields
  const allowedHeroFields = [
    'heroImage', 'heroTitle', 'heroSubtitle', 'heroCtaText', 'heroCtaLink', 'heroEnabled'
  ];

  const sanitizedHeroData: any = {};
  for (const field of allowedHeroFields) {
    if (heroData[field] !== undefined) {
      if (field === 'heroEnabled') {
        sanitizedHeroData[field] = Boolean(heroData[field]);
      } else if (typeof heroData[field] === 'string') {
        // Basic sanitization
        sanitizedHeroData[field] = heroData[field].replace(/[<>'"\\\\]/g, '').slice(0, 500);
      }
    }
  }

  try {
    const updatedStore = await db.update(stores)
      .set({
        ...sanitizedHeroData,
        updatedAt: new Date()
      })
      .where(eq(stores.id, storeId))
      .returning();

    return reply.send({
      message: 'Hero section updated successfully',
      data: updatedStore[0]
    });
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Security: Global error handler to prevent information leakage
fastify.setErrorHandler((error: any, request, reply) => {
  fastify.log.error(error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'An error occurred';

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode >= 500) {
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
    // For client errors, send the message if available
    return reply.code(statusCode).send({ error: message });
  }

  // In development, show full error
  return reply.code(statusCode).send({
    error: message,
    stack: error.stack
  });
});

// Register multipart plugin for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Max 5 files per request
  }
});

// Register static file serving for uploaded images
await fastify.register(staticPlugin, {
  root: join(process.cwd(), 'public'),
  prefix: '/',
  decorateReply: false,
  setHeaders: (res, path) => {
    // Add CORS headers for uploaded images
    if (path.includes('/uploads/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }
});

// Handle OPTIONS preflight for uploads
fastify.options('/uploads/*', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  reply.status(204).send();
});

// Add CORS headers for static files before they are served
fastify.addHook('preHandler', async (request, reply) => {
  if (request.url?.startsWith('/uploads/')) {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
});

// Register routes
await fastify.register(productRoutes, { prefix: '/api/products' });
await fastify.register(categoryRoutes, { prefix: '/api/categories' });
await fastify.register(storeRoutes, { prefix: '/api/store' });
await fastify.register(uploadRoutes, { prefix: '/api/upload' });
await fastify.register(modifierRoutes, { prefix: '/api/modifiers' });
await fastify.register(cartRoutes, { prefix: '/api/cart' });
await fastify.register(checkoutRoutes, { prefix: '/api/checkout' });
await fastify.register(orderRoutes, { prefix: '/api/orders' });
await fastify.register(customerRoutes, { prefix: '/api/customers' });
await fastify.register(reviewRoutes, { prefix: '/api/reviews' });
await fastify.register(couponRoutes, { prefix: '/api/coupons' });
await fastify.register(wishlistRoutes, { prefix: '/api/wishlist' });
await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
await fastify.register(superAdminRoutes, { prefix: '/api/super-admin' });

// Start the server
try {
  await fastify.listen({ port: 8000, host: '0.0.0.0' });
  console.log(`🚀 Server is running at http://localhost:8000`);
  console.log(`📑 Swagger Documentation available at http://localhost:8000/docs`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
