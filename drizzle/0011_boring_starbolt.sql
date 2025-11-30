CREATE TABLE "product_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"product_json" text NOT NULL,
	"vendor_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
