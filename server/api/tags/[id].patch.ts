import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { useDB } from '../../utils/db'
import { tags } from '../../utils/schema'
import { requireOrganizationContext } from '../../utils/session'

const updateTagSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Tag name is required')
      .max(50, 'Tag name must be 50 characters or less')
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
      .optional()
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'No updates provided'
  })

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

  // Only admins and owners can update tags
  if (membership.role !== 'admin' && membership.role !== 'owner') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only admins can update tags'
    })
  }

  const rawBody = await readBody(event)
  const parsed = updateTagSchema.safeParse(rawBody)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        parsed.error.flatten().formErrors.join(', ') || 'Invalid payload',
      data: parsed.error.flatten().fieldErrors
    })
  }

  const existingTag = await db.query.tags.findFirst({
    where: and(eq(tags.id, id), eq(tags.organizationId, organizationId))
  })

  if (!existingTag) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  const payload = parsed.data
  const updates: Partial<typeof tags.$inferInsert> = {}

  if (payload.name && payload.name !== existingTag.name) {
    updates.name = payload.name
  }

  if (payload.color && payload.color !== existingTag.color) {
    updates.color = payload.color
  }

  if (Object.keys(updates).length > 0) {
    await db.update(tags).set(updates).where(eq(tags.id, id))
  }

  const [updatedTag] = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      createdAt: tags.createdAt
    })
    .from(tags)
    .where(eq(tags.id, id))

  return {
    tag: updatedTag,
    unchanged: Object.keys(updates).length === 0
  }
})
