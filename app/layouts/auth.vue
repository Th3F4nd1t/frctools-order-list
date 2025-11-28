<template>
  <NuxtLayout name="default">
    <div class="h-screen flex items-center justify-center px-4">
      <UPageCard
        variant="subtle"
        class="max-w-sm w-full"
      >
        <slot />
      </UPageCard>
    </div>
  </NuxtLayout>
</template>
