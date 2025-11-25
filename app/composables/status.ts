export const statuses = [
  {
    key: 'to_order',
    label: 'To order',
    description: 'Parts requests - awaiting purchase',
    color: 'primary'
  },
  {
    key: 'ordered',
    label: 'Ordered',
    description: 'Placed orders - awaiting arrival',
    color: 'warning'
  },
  {
    key: 'arrived',
    label: 'Arrived',
    description: 'Items received',
    color: 'success'
  }
] as const

export type StatusKey = (typeof statuses)[number]['key']

export const useStatusLookup = Object.fromEntries(
  statuses.map(status => [status.key, status])
) as Record<StatusKey, (typeof statuses)[number]>
