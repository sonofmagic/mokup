import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'shp_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `TRK ${id}`
  const defaults = {
    carrier: 'DHL',
    eta: '2026-01-22',
  }
  return {
    id,
    tracking: displayValue,
    status: 'in_transit',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}

export default handler
