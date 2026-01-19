import type { DocsMockResponseHandler } from '../types'

const handler: DocsMockResponseHandler = (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'pro_2001',
      displayName: 'Profile 2001',
      status: 'active',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      bio: 'Hello there.',
      avatarUrl: 'https://cdn.example.com/avatar.png',
    },
  }
}

export default handler
