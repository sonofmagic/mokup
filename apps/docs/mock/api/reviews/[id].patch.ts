import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'rev_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Review ${id}`
  const defaults = {
    rating: 4,
    productId: 'prd_1001',
    authorId: 'usr_1002',
  }
  return {
    ok: true,
    data: {
      id,
      title: displayValue,
      status: 'pending',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}

export default handler
