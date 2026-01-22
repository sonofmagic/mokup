import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `rev_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      title: 'Review 2001',
      status: 'pending',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      rating: 4,
      productId: 'prd_1001',
      authorId: 'usr_1002',
    },
  }
}

export default handler
