import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: 'frd_2001',
      name: 'Friend 2001',
      status: 'accepted',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      since: '2025-12-20',
    },
  }
}

export default handler
