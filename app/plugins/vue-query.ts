import type {
  DehydratedState,
  VueQueryPluginOptions
} from '@tanstack/vue-query'
import {
  VueQueryPlugin,
  QueryClient,
  dehydrate,
  hydrate
} from '@tanstack/vue-query'
import { defineNuxtPlugin, useState } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  const vueQueryState = useState<DehydratedState | null>(
    'vue-query',
    () => null
  )

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 1000 * 30
      },
      mutations: {
        retry: 1
      }
    }
  })

  const options: VueQueryPluginOptions = {
    queryClient
  }

  nuxtApp.vueApp.use(VueQueryPlugin, options)

  if (import.meta.server) {
    nuxtApp.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    nuxtApp.hooks.hook('app:created', () => {
      if (vueQueryState.value) {
        hydrate(queryClient, vueQueryState.value)
      }
    })
  }
})
