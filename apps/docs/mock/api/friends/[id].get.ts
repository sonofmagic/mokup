import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'frd_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Friend ${id}`
  const defaults = {
    since: '2025-12-20',
  }
  return {
    id,
    name: displayValue,
    status: 'accepted',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}

export default handler
