import type { DocsMockResponseHandler } from '../../types'

const handler: DocsMockResponseHandler = (req) => {
  const rawId = req.params?.id ?? 'met_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Metric ${id}`
  const defaults = {
    period: '30d',
    value: 1280,
    trend: 'up',
  }
  return {
    id,
    name: displayValue,
    status: 'ready',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}

export default handler
