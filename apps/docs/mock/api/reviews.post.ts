import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: 'rev_2001',
      title: 'Review 2001',
      status: 'pending',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      rating: 4,
      productId: 'prd_1001',
      authorId: 'usr_1002',
    },
  }
}

export default handler
