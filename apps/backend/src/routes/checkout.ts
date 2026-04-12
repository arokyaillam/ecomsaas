import { FastifyInstance } from 'fastify';
import { db, orders, orderItems, carts, cartItems, products, customers, coupons, stores } from '../db/index.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireTenant } from '../middleware/tenant.js';

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Validation schemas
const shippingAddressSchema = z.object({
  name: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().min(1),
  postalCode: z.string().min(1),
  phone: z.string().optional(),
});

const checkoutSchema = z.object({
  storeId: z.string().uuid(),
  cartId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  shippingMethod: z.enum(['standard', 'express', 'overnight']).default('standard'),
  paymentMethod: z.enum(['card', 'cash_on_delivery', 'bank_transfer']).default('card'),
  notes: z.string().optional(),
});

export default async function checkoutRoutes(fastify: FastifyInstance) {
  // Create checkout session - protected by tenant middleware
  fastify.post('/create', {
    preHandler: [requireTenant],
  }, async (request, reply) => {
    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid checkout data', details: parsed.error.format() });
    }

    const {
      storeId,
      cartId,
      customerId,
      email,
      phone,
      shippingAddress,
      billingAddress,
      shippingMethod,
      paymentMethod,
      notes,
    } = parsed.data;

    // Verify tenant matches store (security check)
    const tenantId = (request as any).tenantId;
    if (tenantId !== storeId) {
      return reply.status(403).send({ error: 'Store access denied for this tenant' });
    }

    try {
      // Create order and decrement stock in a transaction
      // ALL database operations inside - they succeed or fail together
      const result = await db.transaction(async (tx) => {
        // Verify store exists (inside transaction for consistency)
        const storeArr = await tx.select({ id: stores.id, currency: stores.currency })
          .from(stores)
          .where(eq(stores.id, storeId))
          .limit(1);

        if (storeArr.length === 0) {
          throw new Error('Store not found');
        }
        const storeCurrency = storeArr[0].currency || 'USD';

        // Get cart items (inside transaction to prevent race conditions)
        const items = await tx.select({
          item: cartItems,
          product: products,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.cartId, cartId));

        if (items.length === 0) {
          throw new Error('Cart is empty');
        }

        // Verify all products belong to the same store
        for (const { product } of items) {
          if (product.storeId !== storeId) {
            throw new Error('Cart contains products from a different store');
          }
        }

        // Validate stock inside transaction (prevents race conditions)
        for (const { item, product } of items) {
          // Re-fetch product stock inside transaction to ensure we have latest data
          const [currentProduct] = await tx.select({ currentQuantity: products.currentQuantity })
            .from(products)
            .where(eq(products.id, product.id))
            .for('update'); // Lock the row

          if (!currentProduct || Number(currentProduct.currentQuantity) < item.quantity) {
            throw new Error(`Insufficient stock for ${product.titleEn}`);
          }
        }

        // Get cart (inside transaction)
        const cartArr = await tx.select().from(carts).where(eq(carts.id, cartId)).limit(1);
        if (cartArr.length === 0) {
          throw new Error('Cart not found');
        }
        const cart = cartArr[0];

        // Calculate totals
        const subtotal = Number(cart.subtotal);
        const couponDiscount = Number(cart.couponDiscount || 0);
        const shipping = calculateShipping(shippingMethod, subtotal);
        const tax = calculateTax(subtotal - couponDiscount, shippingAddress.country);
        const total = subtotal - couponDiscount + shipping + tax;

        const orderData = {
          storeId,
          customerId: customerId || null,
          orderNumber: generateOrderNumber(),
          email,
          phone: phone || null,
          currency: storeCurrency,
          subtotal: subtotal.toString(),
          tax: tax.toString(),
          shipping: shipping.toString(),
          discount: couponDiscount.toString(),
          total: total.toString(),
          // Shipping address
          shippingName: shippingAddress.name || null,
          shippingFirstName: shippingAddress.firstName,
          shippingLastName: shippingAddress.lastName,
          shippingAddressLine1: shippingAddress.addressLine1,
          shippingAddressLine2: shippingAddress.addressLine2 || null,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state || null,
          shippingCountry: shippingAddress.country,
          shippingPostalCode: shippingAddress.postalCode,
          // Billing address
          billingName: billingAddress?.name || shippingAddress.name || null,
          billingFirstName: billingAddress?.firstName || shippingAddress.firstName,
          billingLastName: billingAddress?.lastName || shippingAddress.lastName,
          billingAddressLine1: billingAddress?.addressLine1 || shippingAddress.addressLine1,
          billingAddressLine2: billingAddress?.addressLine2 || shippingAddress.addressLine2 || null,
          billingCity: billingAddress?.city || shippingAddress.city,
          billingState: billingAddress?.state || shippingAddress.state || null,
          billingCountry: billingAddress?.country || shippingAddress.country,
          billingPostalCode: billingAddress?.postalCode || shippingAddress.postalCode,
          // Payment & Shipping
          paymentMethod,
          shippingMethod,
          couponCode: cart.couponCode || null,
          couponId: cart.couponCode ? undefined : undefined, // Will be looked up if needed
          notes: notes || null,
          status: 'pending',
          paymentStatus: 'pending',
          fulfillmentStatus: 'unfulfilled',
        };

        const newOrder = await tx.insert(orders).values(orderData).returning();
        const order = newOrder[0];

        // Create order items and decrement stock
        for (const { item, product } of items) {
          await tx.insert(orderItems).values({
            orderId: order.id,
            storeId,
            productId: product.id,
            productTitle: product.titleEn,
            productImage: product.images?.split(',')[0] || null,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            modifiers: item.modifiers,
          });

          // Decrease stock (safe: already validated above with row lock)
          await tx.update(products)
            .set({
              currentQuantity: sql`${products.currentQuantity} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, product.id));
        }

        // Update coupon usage
        if (cart.couponCode) {
          await tx.update(coupons)
            .set({
              usageCount: sql`${coupons.usageCount} + 1`,
            })
            .where(and(
              eq(coupons.storeId, storeId),
              eq(coupons.code, cart.couponCode)
            ));
        }

        // Clear cart items
        await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
        await tx.delete(carts).where(eq(carts.id, cartId));

        return order;
      });

      return reply.send({
        data: {
          orderId: result.id,
          orderNumber: result.orderNumber,
          total: result.total,
          status: result.status,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);

      // Handle specific transaction errors
      if (error.message === 'Store not found') {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message === 'Cart is empty') {
        return reply.status(400).send({ error: error.message });
      }
      if (error.message === 'Cart contains products from a different store') {
        return reply.status(400).send({ error: error.message });
      }
      if (error.message?.startsWith('Insufficient stock')) {
        return reply.status(400).send({ error: error.message });
      }
      if (error.message === 'Cart not found') {
        return reply.status(404).send({ error: error.message });
      }

      return reply.status(500).send({ error: 'Failed to create order' });
    }
  });

  // Get shipping options
  fastify.get('/shipping-options', async (request, reply) => {
    const { country, subtotal } = request.query as any;

    const options = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: '5-7 business days',
        price: Number(subtotal) > 50 ? 0 : 5.99,
        estimatedDays: '5-7',
      },
      {
        id: 'express',
        name: 'Express Shipping',
        description: '2-3 business days',
        price: 12.99,
        estimatedDays: '2-3',
      },
      {
        id: 'overnight',
        name: 'Overnight Shipping',
        description: 'Next business day',
        price: 24.99,
        estimatedDays: '1',
      },
    ];

    return reply.send({ data: options });
  });

  // Payment intent (DEVELOPMENT ONLY — Replace with Stripe integration for production)
  fastify.post('/payment-intent', async (request, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(501).send({
        error: 'Payment integration not configured. Please integrate Stripe or another payment provider.',
      });
    }

    const paymentIntentSchema = z.object({
      orderId: z.string().uuid(),
      paymentMethod: z.string().optional(),
    });

    const parsed = paymentIntentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.format() });
    }

    const { orderId } = parsed.data;

    try {
      const orderArr = await db.select({
        id: orders.id,
        total: orders.total,
        currency: orders.currency,
      })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (orderArr.length === 0) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const order = orderArr[0];

      // DEVELOPMENT ONLY: Simulated payment intent
      // TODO: Replace with actual Stripe PaymentIntent creation
      fastify.log.warn('⚠️ Using simulated payment intent. Replace with Stripe for production.');

      const clientSecret = `pi_dev_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`;

      return reply.send({
        data: {
          clientSecret,
          amount: order.total,
          currency: order.currency?.toLowerCase() || 'usd',
          isDemo: true,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create payment intent' });
    }
  });

  // Confirm payment (DEVELOPMENT ONLY — Replace with Stripe webhook for production)
  fastify.post('/confirm-payment', async (request, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(501).send({
        error: 'Payment confirmation not configured. Use Stripe webhooks for production.',
      });
    }

    const confirmSchema = z.object({
      orderId: z.string().uuid(),
      paymentIntentId: z.string().min(1),
    });

    const parsed = confirmSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.format() });
    }

    const { orderId, paymentIntentId } = parsed.data;

    try {
      // DEVELOPMENT ONLY: Simulated payment confirmation
      // TODO: Replace with Stripe webhook signature verification
      fastify.log.warn('⚠️ Using simulated payment confirmation. Replace with Stripe webhooks for production.');

      // Verify the payment intent ID starts with 'pi_dev_' (only allowed in development)
      if (!paymentIntentId.startsWith('pi_dev_')) {
        return reply.status(400).send({ error: 'Invalid payment intent' });
      }

      const updated = await db.update(orders)
        .set({
          paymentStatus: 'paid',
          status: 'confirmed',
          paymentIntentId,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      return reply.send({
        data: { message: 'Payment confirmed (development mode)', orderId },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to confirm payment' });
    }
  });
}

function calculateShipping(method: string, subtotal: number): number {
  if (subtotal >= 50) return 0; // Free shipping over $50

  switch (method) {
    case 'express':
      return 12.99;
    case 'overnight':
      return 24.99;
    case 'standard':
    default:
      return 5.99;
  }
}

// TODO: Implement proper tax calculation service per region/jurisdiction
function calculateTax(subtotal: number, country?: string): number {
  // Placeholder: flat 8% for US, 0% elsewhere
  // In production, use a tax calculation service like TaxJar or Avalara
  const taxRate = country === 'US' ? 0.08 : 0;
  return subtotal * taxRate;
}