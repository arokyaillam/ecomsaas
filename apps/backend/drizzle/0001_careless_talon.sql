CREATE TABLE "modifier_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modifier_group_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text,
	"price_adjustment" numeric DEFAULT '0',
	"image_url" text,
	"sort_order" integer DEFAULT 0,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD COLUMN "is_required" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD COLUMN "min_selections" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD COLUMN "max_selections" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "hero_image" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "hero_title" text DEFAULT 'Welcome to Our Store';--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "hero_subtitle" text DEFAULT 'Discover amazing products at great prices';--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "hero_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_modifier_group_id_modifier_groups_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;