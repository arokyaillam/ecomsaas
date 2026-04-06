import { pgTable, text, timestamp, uuid, integer, decimal, boolean, json } from "drizzle-orm/pg-core";

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  // Theme Settings
  primaryColor: text("primary_color").default("#0ea5e9"),
  secondaryColor: text("secondary_color").default("#6366f1"),
  accentColor: text("accent_color").default("#8b5cf6"),
  backgroundColor: text("background_color").default("#0f172a"),
  surfaceColor: text("surface_color").default("#1e293b"),
  textColor: text("text_color").default("#f8fafc"),
  textSecondaryColor: text("text_secondary_color").default("#94a3b8"),
  borderColor: text("border_color").default("rgba(255,255,255,0.1)"),
  borderRadius: text("border_radius").default("12px"),
  fontFamily: text("font_family").default("Inter, sans-serif"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  // Store Settings
  currency: text("currency").default("USD"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("OWNER").notNull(),
  storeId: uuid("store_id")
    .references(() => stores.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .references(() => stores.id)
    .notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subcategories = pgTable("subcategories", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .references(() => categories.id)
    .notNull(),
  storeId: uuid("store_id")
    .references(() => stores.id)
    .notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .references(() => stores.id)
    .notNull(),
  categoryId: uuid("category_id")
    .references(() => categories.id)
    .notNull(),
  subcategoryId: uuid("subcategory_id").references(() => subcategories.id),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar"),
  sortOrder: integer("sort_order").default(0),
  preparationTime: integer("preparation_time"),
  tags: text("tags"),
  images: text("images"),
  youtubeVideoLinkId: text("youtube_video_link_id"),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  salePrice: decimal("sale_price").notNull(),
  purchasePrice: decimal("purchase_price"),
  purchaseLimit: integer("purchase_limit"),
  barcode: text("barcode"),
  discountType: text("discount_type").default("Percent"),
  discount: decimal("discount").default("0"),
  souqDealDiscount: decimal("souq_deal_discount"),
  currentQuantity: integer("current_quantity").default(0),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const modifierGroups = pgTable("modifier_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .references(() => stores.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

