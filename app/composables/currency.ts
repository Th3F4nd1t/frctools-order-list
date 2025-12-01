// Common currencies list for selection
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' }
] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code']

export const DEFAULT_CURRENCY: CurrencyCode = 'USD'

export interface OrganizationMetadata {
  currency?: CurrencyCode
}

/**
 * Parse organization metadata from string or object format
 */
export function parseOrganizationMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata) return {}
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata)
    } catch {
      return {}
    }
  }
  if (typeof metadata === 'object') {
    return metadata as Record<string, unknown>
  }
  return {}
}

/**
 * Composable for getting and formatting currency based on the organization settings.
 * Returns USD as default if organization has no currency set.
 */
export function useOrganizationCurrency() {
  const { organization } = useOrgs()

  const currency = computed<CurrencyCode>(() => {
    if (!organization.value) return DEFAULT_CURRENCY

    const metadata = parseOrganizationMetadata(organization.value.metadata) as OrganizationMetadata
    return metadata?.currency ?? DEFAULT_CURRENCY
  })

  const currencyInfo = computed(() => {
    const defaultInfo = SUPPORTED_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY)!
    return SUPPORTED_CURRENCIES.find(c => c.code === currency.value)
      ?? defaultInfo
  })

  /**
   * Format a value from cents to a localized currency string
   */
  function formatCurrencyFromCents(value?: number | null): string | null {
    if (value === undefined || value === null) return null
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.value,
        minimumFractionDigits: 2
      }).format(value / 100)
    } catch {
      return `${(value / 100).toFixed(2)}`
    }
  }

  /**
   * Format a decimal price value to a localized currency string
   */
  function formatCurrency(value?: number | null): string | null {
    if (value === undefined || value === null) return null
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.value,
        minimumFractionDigits: 2
      }).format(value)
    } catch {
      return `${value.toFixed(2)}`
    }
  }

  return {
    currency,
    currencyInfo,
    formatCurrencyFromCents,
    formatCurrency
  }
}
