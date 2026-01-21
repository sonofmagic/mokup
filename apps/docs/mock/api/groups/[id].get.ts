import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'grp_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Group ${id}`
  const defaults = {
    membersCount: 12,
    privacy: 'private',
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
