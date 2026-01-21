import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'ord_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `ORD ${id}`
  const defaults = {
    total: {
      amount: 240,
      currency: 'USD',
    },
    currency: 'USD',
    customerId: 'usr_1001',
  }
  return {
    ok: true,
    data: {
      id,
      number: displayValue,
      status: 'processing',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}

export default handler
