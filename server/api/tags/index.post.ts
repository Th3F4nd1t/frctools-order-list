import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDB } from '../../utils/db'
import { tags } from '../../utils/schema'
import { requireOrganizationContext } from '../../utils/session'

const createTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be 50 characters or less'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
    .default('#6366f1')
})

export default defineEventHandler(async (event) => {
  const { organizationId, membership }
    = await requireOrganizationContext(event)

  // Only admins and owners can create tags
  if (membership.role !== 'admin' && membership.role !== 'owner') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only admins can create tags'
    })
  }

  const rawBody = await readBody(event)
  const parsed = createTagSchema.safeParse(rawBody)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        parsed.error.flatten().formErrors.join(', ') || 'Invalid payload',
      data: parsed.error.flatten().fieldErrors
    })
  }

  const payload = parsed.data
  const tagId = crypto.randomUUID()

  await useDB().insert(tags).values({
    id: tagId,
    organizationId,
    name: payload.name,
    color: payload.color
  })

  const [newTag] = await useDB()
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      createdAt: tags.createdAt
    })
    .from(tags)
    .where(eq(tags.id, tagId))

  return {
    tag: newTag
  }
})
