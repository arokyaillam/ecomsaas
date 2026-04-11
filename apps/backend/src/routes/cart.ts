import { FastifyInstance } from 'fastify';
import { db, carts, cartItems, products, coupons } from '../db/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const generateSessionId = () => `sess_${randomUUID().replace(/-/g, '')}`;

export default async function cartRoutes(fastify: FastifyInstance) {
  // Get or create cart
  fastify.get('/', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const storeId = query.storeId;
    let sessionId = request.cookies?.cart_session_id;
    let customerId: string | null = null;

    // Validate storeId
    if (!storeId) {
      return reply.status(400).send({ error: 'storeId is required' });
    }

    // Check if customer is logged in (from JWT)
    try {
      await request.jwtVerify();
      const user = request.user as { customerId?: string };
      customerId = user?.customerId || null;
    } catch {
      // Not logged in, use session
    }

    if (!sessionId && !customerId) {
      sessionId = generateSessionId();
      reply.setCookie('cart_session_id', sessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    try {
      // Find existing cart
      let cartQuery;

      if (customerId) {
        cartQuery = db.select().from(carts).where(
          and(eq(carts.storeId, storeId), eq(carts.customerId, customerId))
        );
      } else if (sessionId) {
        cartQuery = db.select().from(carts).where(
          and(eq(carts.storeId, storeId), eq(carts.sessionId, sessionId))
        );
      } else {
        // Should not happen, but handle gracefully
        cartQuery = db.select().from(carts).where(eq(carts.storeId, storeId));
      }

      let cartArr = await cartQuery.limit(1);
      let cart = cartArr[0];

      // Create new cart if not found
      if (!cart) {
        const newCart = await db.insert(carts).values({
          storeId,
          customerId,
          sessionId: sessionId || generateSessionId(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        }).returning();
        cart = newCart[0];
      }

      // Get cart items with product details
      const items = await db.select({
        item: cartItems,
        product: {
          id: products.id,
          titleEn: products.titleEn,
          titleAr: products.titleAr,
          images: products.images,
          salePrice: products.salePrice,
          currentQuantity: products.currentQuantity,
          isPublished: products.isPublished,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

      return reply.send({
        data: {
          ...cart,
          items: items.map(({ item, product }) => ({
            ...item,
            product,
          })),
        },
      });
    } catch (error: any) {
      fastify.log.error('Cart fetch error:', error);
      return reply.status(500).send({ error: 'Failed to get cart', details: error.message });
    }
  });

  // Add item to cart
  fastify.post('/items', async (request, reply) => {
    const { storeId, productId, quantity, modifiers } = request.body as any;
    let sessionId = request.cookies?.cart_session_id;
    let customerId = null;

    try {
      await request.jwtVerify();
      const user = request.user as { customerId?: string };
      customerId = user?.customerId || null;
    } catch {
      // Not logged in
    }

    if (!sessionId && !customerId) {
      sessionId = generateSessionId();
      reply.setCookie('cart_session_id', sessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    try {
      // Get product details
      const productArr = await db.select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
        .limit(1);

      if (productArr.length === 0) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      const product = productArr[0];

      if (!product.isPublished) {
        return reply.status(400).send({ error: 'Product is not available' });
      }

      if (Number(product.currentQuantity) < quantity) {
        return reply.status(400).send({ error: 'Insufficient stock' });
      }

      // Find or create cart
      let cartQuery = db.select().from(carts).where(eq(carts.storeId, storeId));

      if (customerId) {
        cartQuery = db.select().from(carts).where(
          and(eq(carts.storeId, storeId), eq(carts.customerId, customerId))
        );
      } else if (sessionId) {
        cartQuery = db.select().from(carts).where(
          and(eq(carts.storeId, storeId), eq(carts.sessionId, sessionId))
        );
      } else {
        return reply.status(400).send({ error: 'Session required' });
      }

      let cartArr = await cartQuery.limit(1);
      let cart = cartArr[0];

      if (!cart) {
        const newCart = await db.insert(carts).values({
          storeId,
          customerId,
          sessionId: sessionId || generateSessionId(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        }).returning();
        cart = newCart[0];
      }

      // Check if item already exists
      const existingItem = await db.select()
        .from(cartItems)
        .where(and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, productId)
        ))
        .limit(1);

      const price = Number(product.salePrice);
      const modifiersTotal = modifiers?.reduce((sum: number, mod: any) => sum + Number(mod.priceAdjustment || 0), 0) || 0;
      const unitPrice = price + modifiersTotal;
      const total = unitPrice * quantity;

      if (existingItem.length > 0) {
        // Update quantity
        const newQuantity = existingItem[0].quantity + quantity;
        await db.update(cartItems)
          .set({
            quantity: newQuantity,
            total: (unitPrice * newQuantity).toString(),
            modifiers: modifiers || existingItem[0].modifiers,
          })
          .where(eq(cartItems.id, existingItem[0].id));
      } else {
        // Add new item
        await db.insert(cartItems).values({
          cartId: cart.id,
          productId,
          quantity,
          price: unitPrice.toString(),
          total: total.toString(),
          modifiers: modifiers || [],
        });
      }

      // Update cart totals
      await updateCartTotals(cart.id);

      return reply.send({ message: 'Item added to cart' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to add item' });
    }
  });

  // Update cart item quantity
  fastify.put('/items/:itemId', async (request, reply) => {
    const { itemId } = request.params as { itemId: string };
    const { quantity } = request.body as { quantity: number };

    try {
      const itemArr = await db.select()
        .from(cartItems)
        .where(eq(cartItems.id, itemId))
        .limit(1);

      if (itemArr.length === 0) {
        return reply.status(404).send({ error: 'Item not found' });
      }

      const item = itemArr[0];
      const unitPrice = Number(item.price);
      const total = unitPrice * quantity;

      if (quantity <= 0) {
        await db.delete(cartItems).where(eq(cartItems.id, itemId));
      } else {
        await db.update(cartItems)
          .set({ quantity, total: total.toString() })
          .where(eq(cartItems.id, itemId));
      }

      // Update cart totals
      await updateCartTotals(item.cartId);

      return reply.send({ message: 'Cart updated' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update item' });
    }
  });

  // Remove item from cart
  fastify.delete('/items/:itemId', async (request, reply) => {
    const { itemId } = request.params as { itemId: string };

    try {
      const itemArr = await db.select()
        .from(cartItems)
        .where(eq(cartItems.id, itemId))
        .limit(1);

      if (itemArr.length === 0) {
        return reply.status(404).send({ error: 'Item not found' });
      }

      const cartId = itemArr[0].cartId;

      await db.delete(cartItems).where(eq(cartItems.id, itemId));

      // Update cart totals
      await updateCartTotals(cartId);

      return reply.send({ message: 'Item removed' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to remove item' });
    }
  });

  // Apply coupon
  fastify.post('/coupon', async (request, reply) => {
    const { storeId, couponCode } = request.body as any;
    let sessionId = request.cookies?.cart_session_id;
    let customerId = null;

    try {
      await request.jwtVerify();
      const user = request.user as { customerId?: string };
      customerId = user?.customerId || null;
    } catch {
      // Not logged in
    }

    try {
      // Validate coupon
      const couponArr = await db.select()
        .from(coupons)
        .where(and(
          eq(coupons.storeId, storeId),
          eq(coupons.code, couponCode.toUpperCase()),
          eq(coupons.isActive, true)
        ))
        .limit(1);

      if (couponArr.length === 0) {
        return reply.status(400).send({ error: 'Invalid coupon code' });
      }

      const coupon = couponArr[0];

      // Check expiry
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return reply.status(400).send({ error: 'Coupon has expired' });
      }

      if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
        return reply.status(400).send({ error: 'Coupon not yet active' });
      }

      // Check usage limit
      if (coupon.usageLimit && Number(coupon.usageCount) >= coupon.usageLimit) {
        return reply.status(400).send({ error: 'Coupon usage limit reached' });
      }

      // Find cart
      let cartQuery = db.select().from(carts).where(eq(carts.storeId, storeId));

      if (customerId) {
        cartQuery = db.select().from(carts).where(
          and(eq(carts.storeId, storeId), eq(carts.customerId, customerId))
        );
      } else if (sessionId) {
        cartQuery = db.select().from(carts).where(
          and(eq(carts.storeId, storeId), eq(carts.sessionId, sessionId))
        );
      } else {
        return reply.status(400).send({ error: 'Cart session not found' });
      }

      const cartArr = await cartQuery.limit(1);

      if (cartArr.length === 0) {
        return reply.status(404).send({ error: 'Cart not found' });
      }

      const cart = cartArr[0];

      // Check minimum order amount
      if (coupon.minOrderAmount && Number(cart.subtotal) < Number(coupon.minOrderAmount)) {
        return reply.status(400).send({
          error: `Minimum order amount of ${coupon.minOrderAmount} required`
        });
      }

      // Calculate discount
      let discount = 0;
      if (coupon.type === 'percentage') {
        discount = Number(cart.subtotal) * (Number(coupon.value) / 100);
        if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
          discount = Number(coupon.maxDiscountAmount);
        }
      } else if (coupon.type === 'fixed_amount') {
        discount = Number(coupon.value);
      }

      // Apply coupon
      await db.update(carts)
        .set({
          couponCode: coupon.code,
          couponDiscount: discount.toString(),
          total: (Number(cart.subtotal) - discount).toString(),
        })
        .where(eq(carts.id, cart.id));

      return reply.send({
        data: {
          couponCode: coupon.code,
          discount: discount.toString(),
          message: 'Coupon applied successfully',
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to apply coupon' });
    }
  });

  // Clear cart
  fastify.delete('/', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const storeId = query.storeId;
    let sessionId = request.cookies?.cart_session_id;
    let customerId: string | null = null;

    try {
      await request.jwtVerify();
      const user = request.user as { customerId?: string };
      customerId = user?.customerId || null;
    } catch {
      // Not logged in
    }

    try {
      let cartQuery = db.select().from(carts).where(eq(carts.storeId, storeId));

      if (customerId) {
        cartQuery = db.select().from(carts).where(
          and(eq(carts.storeId, storeId), eq(carts.customerId, customerId))
        );
      } else if (sessionId) {
        cartQuery = db.select().from(carts).where(
          and(eq(carts.storeId, storeId), eq(carts.sessionId, sessionId))
        );
      }

      const cartArr = await cartQuery.limit(1);

      if (cartArr.length > 0) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cartArr[0].id));
        await db.delete(carts).where(eq(carts.id, cartArr[0].id));
      }

      return reply.send({ message: 'Cart cleared' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to clear cart' });
    }
  });
}

async function updateCartTotals(cartId: string) {
  const items = await db.select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));

  const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  await db.update(carts)
    .set({
      subtotal: subtotal.toString(),
      total: subtotal.toString(),
      itemCount,
      updatedAt: new Date(),
    })
    .where(eq(carts.id, cartId));
}
