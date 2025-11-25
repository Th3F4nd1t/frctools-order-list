import { useQuery } from '@tanstack/vue-query'

export const ORDERS_QUERY_KEY = ['orders'] as const

export function useOrdersQuery() {
  const requestFetch = useRequestFetch()

  return useQuery({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: async () => {
      const response = await requestFetch('/api/orders')
      return response.orders ?? []
    }
  })
}
