<template>
  <div
    v-if="hasOrganization"
    class="contents"
  >
    <slot />
  </div>

  <div
    v-else
    class="contents"
  >
    <div class="h-screen flex items-center justify-center px-4">
      <UPageCard
        variant="subtle"
        class="max-w-sm w-full"
        title="Create an organization"
        description="To get started, create or join an organization."
        icon="i-lucide-building-2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onServerPrefetch } from 'vue'

const auth = useAuth()
const { organization, fetchCurrentOrganization } = useOrgs()

const organizationId = computed(
  () => auth.session.value?.activeOrganizationId ?? null
)

const hasOrganization = computed(() => {
  if (!auth.user.value || !auth.session.value) return false
  return Boolean(organization.value)
})


</script>
