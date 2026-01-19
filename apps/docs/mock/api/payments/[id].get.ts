import type { DocsMockResponseHandler } from '../../types'

const handler: DocsMockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'pay_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `PAY ${id}`
  const defaults = {
    amount: {
      amount: 120,
      currency: 'USD',
    },
    provider: 'stripe',
  }
  return {
    id,
    reference: displayValue,
    status: 'authorized',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}

export default handler
