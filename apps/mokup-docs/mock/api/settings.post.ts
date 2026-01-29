import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `set_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      key: 'Setting 2001',
      status: 'active',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      value: 'enabled',
      scope: 'org',
    },
  }
}

export default handler
