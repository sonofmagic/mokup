import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'pst_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Post ${id}`
  const defaults = {
    authorId: 'usr_1001',
    content: 'Sample post content',
    likes: 12,
  }
  return {
    ok: true,
    data: {
      id,
      title: displayValue,
      status: 'published',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}

export default handler
