import type { RouteRule } from 'mokup'

const rules: RouteRule[] = [
  {
    enabled: false,
    handler: () => ({
      variant: 'disabled',
      note: 'This rule is intentionally disabled.',
    }),
  },
  {
    handler: () => ({
      variant: 'active',
      note: 'This rule is active and served.',
      updatedAt: new Date().toISOString(),
    }),
  },
]

export default rules
