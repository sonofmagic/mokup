import type { DocsMockResponseHandler } from '../../types'

const handler: DocsMockResponseHandler = (req) => {
  const rawId = req.params?.id ?? 'shp_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `TRK ${id}`
  const defaults = {
    carrier: 'DHL',
    eta: '2026-01-22',
  }
  return {
    ok: true,
    data: {
      id,
      tracking: displayValue,
      status: 'in_transit',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}

export default handler
