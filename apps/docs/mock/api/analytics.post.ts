import type { DocsMockResponseHandler } from '../types'

const handler: DocsMockResponseHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: 'met_2001',
      name: 'Metric 2001',
      status: 'ready',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      period: '30d',
      value: 1280,
      trend: 'up',
    },
  }
}

export default handler
