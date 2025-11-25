import { defineEventHandler } from 'h3'
import { eq, desc, sql } from 'drizzle-orm'
import { useDB } from '../../utils/db'
import { orders, vendors } from '../../utils/schema'
import { user as authUser } from '../../utils/auth-schema'
import { requireOrganizationContext } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const { organizationId } = await requireOrganizationContext(event)

  const orderRecords = await useDB()
    .select({
      id: orders.id,
      organizationId: orders.organizationId,
      partName: orders.partName,
      description: orders.description,
      status: orders.status,
      quantity: orders.quantity,
      unitPriceCents: orders.unitPriceCents,
      variantId: orders.variantId,
      variantTitle: orders.variantTitle,
      vendorId: orders.vendorId,
      vendorName: sql<
        string | null
      >`coalesce(${vendors.name}, ${orders.vendorName})`,
      vendorType: vendors.type,
      externalUrl: orders.externalUrl,
      orderedAt: orders.orderedAt,
      arrivedAt: orders.arrivedAt,
      requestedBy: orders.requestedBy,
      requestedByName: authUser.name,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt
    })
    .from(orders)
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .leftJoin(authUser, eq(orders.requestedBy, authUser.id))
    .where(eq(orders.organizationId, organizationId))
    .orderBy(desc(orders.createdAt))

  return {
    orders: orderRecords
  }
})
