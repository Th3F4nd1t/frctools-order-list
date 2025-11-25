ALTER TABLE "orders" DROP CONSTRAINT "orders_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "vendor_name" text;