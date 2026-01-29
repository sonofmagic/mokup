import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `pst_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      title: 'Post 2001',
      status: 'published',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      authorId: 'usr_1001',
      content: 'Sample post content',
      likes: 12,
    },
  }
}

export default handler
