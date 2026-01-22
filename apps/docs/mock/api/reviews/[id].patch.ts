import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
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
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      ...defaults,
    },
  }
}

export default handler
