import type { DocsMockResponseHandler } from '../../types'

const handler: DocsMockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'bil_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Billing Account ${id}`
  const defaults = {
    plan: 'pro',
    balance: {
      amount: 120,
      currency: 'USD',
    },
    currency: 'USD',
  }
  return {
    id,
    name: displayValue,
    status: 'active',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}

export default handler
