import { FastifyInstance } from 'fastify';
import { db, orders, orderItems, carts, cartItems, products, customers, coupons, customerAddresses } from '../db/index.js';
import { eq, and, sql, desc } from 'drizzle-orm';

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export default async function checkoutRoutes(fastify: FastifyInstance) {
  // Create checkout session
  fastify.post('/create', async (request, reply) => {
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
    } = request.body as any;

    try {
      // Get cart items
      const items = await db.select({
        item: cartItems,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cartId));

      if (items.length === 0) {
        return reply.status(400).send({ error: 'Cart is empty' });
      }

      // Validate stock
      for (const { item, product } of items) {
        if (Number(product.currentQuantity) < item.quantity) {
          return reply.status(400).send({
            error: `Insufficient stock for ${product.titleEn}`,
          });
        }
      }

      // Get cart
      const cartArr = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
      if (cartArr.length === 0) {
        return reply.status(404).send({ error: 'Cart not found' });
      }
      const cart = cartArr[0];

      // Calculate totals
      const subtotal = Number(cart.subtotal);
      const couponDiscount = Number(cart.couponDiscount || 0);
      const shipping = calculateShipping(shippingMethod, subtotal);
      const tax = calculateTax(subtotal - couponDiscount, shippingAddress?.country);
      const total = subtotal - couponDiscount + shipping + tax;

      // Create order
      const orderData = {
        storeId,
        customerId: customerId || null,
        orderNumber: generateOrderNumber(),
        email,
        phone,
        currency: 'USD', // Get from store settings
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        shipping: shipping.toString(),
        discount: couponDiscount.toString(),
        total: total.toString(),
        // Shipping address
        shippingName: shippingAddress?.name,
        shippingFirstName: shippingAddress?.firstName,
        shippingLastName: shippingAddress?.lastName,
        shippingAddressLine1: shippingAddress?.addressLine1,
        shippingAddressLine2: shippingAddress?.addressLine2,
        shippingCity: shippingAddress?.city,
        shippingState: shippingAddress?.state,
        shippingCountry: shippingAddress?.country,
        shippingPostalCode: shippingAddress?.postalCode,
        // Billing address
        billingName: billingAddress?.name || shippingAddress?.name,
        billingFirstName: billingAddress?.firstName || shippingAddress?.firstName,
        billingLastName: billingAddress?.lastName || shippingAddress?.lastName,
        billingAddressLine1: billingAddress?.addressLine1 || shippingAddress?.addressLine1,
        billingAddressLine2: billingAddress?.addressLine2 || shippingAddress?.addressLine2,
        billingCity: billingAddress?.city || shippingAddress?.city,
        billingState: billingAddress?.state || shippingAddress?.state,
        billingCountry: billingAddress?.country || shippingAddress?.country,
        billingPostalCode: billingAddress?.postalCode || shippingAddress?.postalCode,
        // Payment & Shipping
        paymentMethod,
        shippingMethod,
        couponCode: cart.couponCode,
        notes,
        status: 'pending',
        paymentStatus: 'pending',
        fulfillmentStatus: 'unfulfilled',
      };

      const newOrder = await db.insert(orders).values(orderData).returning();
      const order = newOrder[0];

      // Create order items
      for (const { item, product } of items) {
        await db.insert(orderItems).values({
          orderId: order.id,
          storeId,
          productId: product.id,
          productTitle: product.titleEn,
          productImage: product.images?.split(',')[0] || null,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          modifiers: item.modifiers,
        } as any);

        // Decrease stock
        await db.update(products)
          .set({
            currentQuantity: sql`${products.currentQuantity} - ${item.quantity}`,
          })
          .where(eq(products.id, product.id));
      }

      // Update coupon usage
      if (cart.couponCode) {
        await db.update(coupons)
          .set({
            usageCount: sql`${coupons.usageCount} + 1`,
          })
          .where(and(
            eq(coupons.storeId, storeId),
            eq(coupons.code, cart.couponCode)
          ));
      }

      // Clear cart
      await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
      await db.delete(carts).where(eq(carts.id, cartId));

      return reply.send({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
        },
      });
    } catch (error) {
      fastify.log.error(error);
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

  // Payment intent (Stripe integration placeholder)
  fastify.post('/payment-intent', async (request, reply) => {
    const { orderId, paymentMethod } = request.body as any;

    try {
      const orderArr = await db.select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (orderArr.length === 0) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const order = orderArr[0];

      // Here you would create a Stripe PaymentIntent
      // For now, we'll simulate success
      const clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`;

      return reply.send({
        data: {
          clientSecret,
          amount: order.total,
          currency: order.currency?.toLowerCase() || 'usd',
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create payment intent' });
    }
  });

  // Confirm payment
  fastify.post('/confirm-payment', async (request, reply) => {
    const { orderId, paymentIntentId } = request.body as any;

    try {
      // Verify payment with Stripe (placeholder)
      // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Update order status
      await db.update(orders)
        .set({
          paymentStatus: 'paid',
          status: 'confirmed',
          paymentIntentId,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      return reply.send({
        data: { message: 'Payment confirmed', orderId },
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

function calculateTax(subtotal: number, country?: string): number {
  // Simplified tax calculation
  const taxRate = country === 'US' ? 0.08 : 0;
  return subtotal * taxRate;
}
