import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'crt_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Cart ${id}`
  const defaults = {
    subtotal: {
      amount: 120,
      currency: 'USD',
    },
    itemCount: 3,
    currency: 'USD',
  }
  return {
    ok: true,
    data: {
      id,
      name: displayValue,
      status: 'open',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}

export default handler
