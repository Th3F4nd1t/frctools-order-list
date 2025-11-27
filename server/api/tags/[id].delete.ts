import { defineEventHandler, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDB } from '../../utils/db'
import { tags } from '../../utils/schema'
import { requireOrganizationContext } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const { organizationId, membership }
    = await requireOrganizationContext(event)
  const db = useDB()
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tag id is required'
    })
  }

  // Only admins and owners can delete tags
  if (membership.role !== 'admin' && membership.role !== 'owner') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only admins can delete tags'
    })
  }

  const existingTag = await db.query.tags.findFirst({
    where: and(eq(tags.id, id), eq(tags.organizationId, organizationId))
  })

  if (!existingTag) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  await db.delete(tags).where(eq(tags.id, id))

  return {
    success: true
  }
})
