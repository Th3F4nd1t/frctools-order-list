import { defineEventHandler, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDB } from '../../utils/db'
import { orders } from '../../utils/schema'
import { requireOrganizationContext } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const { organizationId } = await requireOrganizationContext(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Order id is required'
    })
  }

  const deleted = await useDB()
    .delete(orders)
    .where(and(eq(orders.id, id), eq(orders.organizationId, organizationId)))
    .returning({ id: orders.id })

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  return {
    success: true,
    id: deleted[0]?.id
  }
})
