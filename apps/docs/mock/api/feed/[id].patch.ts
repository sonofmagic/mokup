import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
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
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      ...defaults,
    },
  }
}

export default handler
