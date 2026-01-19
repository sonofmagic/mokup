import type { DocsMockResponseHandler } from '../types'

const handler: DocsMockResponseHandler = (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'med_2001',
      name: 'Media 2001',
      status: 'ready',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      type: 'image',
      url: 'https://cdn.example.com/media.png',
      size: 2048,
    },
  }
}

export default handler
