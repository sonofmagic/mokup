import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'set_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Setting ${id}`
  const defaults = {
    value: 'enabled',
    scope: 'org',
  }
  return {
    ok: true,
    data: {
      id,
      key: displayValue,
      status: 'active',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}

export default handler
