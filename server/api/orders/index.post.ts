import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { useDB } from '../../utils/db'
import { orders, vendors } from '../../utils/schema'
import { user as authUser } from '../../utils/auth-schema'
import { requireOrganizationContext } from '../../utils/session'
import { eq, sql } from 'drizzle-orm'

const createOrderSchema = z.object({
  partName: z.string().min(1, 'Part name is required'),
  description: z.string().trim().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  vendorId: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === undefined || value === null) return null
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }),
  unitPriceCents: z
    .union([
      z.coerce.number().int().min(0, 'Price must be zero or more'),
      z.literal('')
    ])
    .optional()
    .transform(value => (typeof value === 'number' ? value : undefined)),
  variantId: z
    .string()
    .trim()
    .optional()
    .transform(value => (value ? value : undefined)),
  variantTitle: z
    .string()
    .trim()
    .optional()
    .transform(value => (value ? value : undefined)),
  externalUrl: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal(''))
    .transform(value => (value ? value : null))
})

export default defineEventHandler(async (event) => {
  const { organizationId, user } = await requireOrganizationContext(event)
  const db = useDB()
  const rawBody = await readBody(event)
  const parsed = createOrderSchema.safeParse(rawBody)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        parsed.error.flatten().formErrors.join(', ') || 'Invalid payload',
      data: parsed.error.flatten().fieldErrors
    })
  }

  const payload = parsed.data
  const vendorInput = payload.vendorId
  let vendorId: string | null = null
  let vendorName: string | null = null

  if (vendorInput) {
    const vendorRecord = await db.query.vendors.findFirst({
      where: eq(vendors.id, vendorInput)
    })

    if (vendorRecord) {
      vendorId = vendorRecord.id
      vendorName = null
    } else {
      vendorName = vendorInput
    }
  }

  const orderId = crypto.randomUUID()

  await db.insert(orders).values({
    id: orderId,
    organizationId,
    partName: payload.partName,
    description:
      payload.description && payload.description.length > 0
        ? payload.description
        : null,
    status: 'to_order',
    quantity: payload.quantity,
    unitPriceCents:
      typeof payload.unitPriceCents === 'number'
        ? payload.unitPriceCents
        : null,
    variantId: payload.variantId ?? null,
    variantTitle: payload.variantTitle ?? null,
    vendorId,
    vendorName,
    externalUrl: payload.externalUrl ?? null,
    requestedBy: user.id
  })

  const [createdOrder] = await db
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
    .where(eq(orders.id, orderId))

  return {
    order: createdOrder
  }
})
