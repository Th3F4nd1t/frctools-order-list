import { createError, type H3Event } from 'h3'
import { useAuth } from './auth'
import type { member } from './auth-schema'

export type BetterAuthSessionResult = Awaited<
  ReturnType<ReturnType<typeof useAuth>['api']['getSession']>
>

export type OrganizationMember = typeof member.$inferSelect

export interface OrganizationContext {
  user: NonNullable<BetterAuthSessionResult>['user']
  session: NonNullable<BetterAuthSessionResult>['session']
  organizationId: string
  membership: OrganizationMember
}

export async function requireOrganizationContext(
  event: H3Event
): Promise<OrganizationContext> {
  const sessionResult = await useAuth().api.getSession({
    headers: event.headers
  })
  if (!sessionResult || !sessionResult.session || !sessionResult.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { session, user } = sessionResult
  const activeOrganizationId = session.activeOrganizationId ?? null
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No organization selected'
    })
  }
  const data = await useAuth().api.getFullOrganization({
    query: {
      organizationId: activeOrganizationId ?? '',
      membersLimit: 100
    },
    // This endpoint requires session cookies.
    headers: Object.entries(await getHeaders(event)) as [string, string][]
  })

  return {
    user,
    session: {
      ...session,
      activeOrganizationId
    },
    organizationId: activeOrganizationId,
    membership: (data!).members.find(m => m.userId === user.id)!
  }
}
