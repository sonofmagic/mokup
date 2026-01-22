import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `pay_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      reference: 'PAY 2001',
      status: 'authorized',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      amount: {
        amount: 120,
        currency: 'USD',
      },
      provider: 'stripe',
    },
  }
}

export default handler
