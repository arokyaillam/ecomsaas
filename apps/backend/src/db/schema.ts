import { pgTable, text, timestamp, uuid, integer, decimal, boolean } from "drizzle-orm/pg-core";

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
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

