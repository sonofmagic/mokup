import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'pro_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Profile ${id}`
  const defaults = {
    bio: 'Hello there.',
    avatarUrl: 'https://cdn.example.com/avatar.png',
  }
  return {
    id,
    displayName: displayValue,
    status: 'active',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}

export default handler
