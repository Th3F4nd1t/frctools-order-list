import { defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { useDB } from '../../utils/db'
import { tags } from '../../utils/schema'
import { requireOrganizationContext } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const { organizationId } = await requireOrganizationContext(event)

  const tagRecords = await useDB()
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      createdAt: tags.createdAt
    })
    .from(tags)
    .where(eq(tags.organizationId, organizationId))
    .orderBy(tags.name)

  return {
    tags: tagRecords
  }
})
