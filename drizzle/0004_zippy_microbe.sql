ALTER TABLE "orders" ADD COLUMN "unit_price_cents" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "variant_title" text;