import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'not_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Notification ${id}`
  const defaults = {
    type: 'system',
    read: false,
    channel: 'email',
  }
  return {
    ok: true,
    data: {
      id,
      title: displayValue,
      status: 'unread',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}

export default handler
