<script setup lang="ts">
const { data: navigation } = await useAsyncData('docs-navigation', () =>
  queryCollectionNavigation('docs')
)
provide('navigation', navigation)

const { data: files } = useLazyAsyncData(
  'docs-search',
  () => queryCollectionSearchSections('docs'),
  {
    server: false
  }
)
</script>

<template>
  <NuxtLayout name="default">
    <UMain>
      <UContainer>
        <UPage>
          <template #left>
            <UPageAside>
              <UContentSearchButton
                :collapsed="false"
                class="w-full mb-4"
              />
              <UContentNavigation
                highlight
                :navigation="navigation"
              />
            </UPageAside>
          </template>

          <slot />
        </UPage>
      </UContainer>
    </UMain>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
    </ClientOnly>
  </NuxtLayout>
</template>
