import { pgEnum, pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { organization, user } from './auth-schema'

export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().$type<'shopify' | 'bigcommerce' | 'amazon'>(),
  config: text('config').notNull(),
  hostname: text('hostname').notNull()
})

export const orderStatusEnum = pgEnum('order_status', [
  'to_order',
  'ordered',
  'arrived'
])

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  partName: text('part_name').notNull(),
  description: text('description'),
  status: orderStatusEnum('status').default('to_order').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPriceCents: integer('unit_price_cents'),
  variantId: text('variant_id'),
  variantTitle: text('variant_title'),
  vendorId: text('vendor_id'),
  vendorName: text('vendor_name'),
  externalUrl: text('external_url'),
  orderedAt: timestamp('ordered_at'),
  arrivedAt: timestamp('arrived_at'),
  requestedBy: text('requested_by')
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
})
