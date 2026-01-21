import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'inv_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `SKU ${id}`
  const defaults = {
    quantity: 120,
    location: 'wh-1',
  }
  return {
    id,
    sku: displayValue,
    status: 'available',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}

export default handler
