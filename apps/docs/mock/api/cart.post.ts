import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `crt_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      name: 'Cart 2001',
      status: 'open',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      subtotal: {
        amount: 120,
        currency: 'USD',
      },
      itemCount: 3,
      currency: 'USD',
    },
  }
}

export default handler
