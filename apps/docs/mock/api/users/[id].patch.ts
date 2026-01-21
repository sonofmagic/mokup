import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'usr_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `User ${id}`
  const defaults = {
    email: 'user@example.com',
    role: 'member',
  }
  return {
    ok: true,
    data: {
      id,
      name: displayValue,
      status: 'active',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}

export default handler
