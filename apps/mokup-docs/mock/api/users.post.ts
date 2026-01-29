import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `usr_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      name: 'User 2001',
      status: 'active',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      email: 'user@example.com',
      role: 'member',
    },
  }
}

export default handler
