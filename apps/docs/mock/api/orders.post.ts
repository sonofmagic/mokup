import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `ord_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      number: 'ORD 2001',
      status: 'processing',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      total: {
        amount: 240,
        currency: 'USD',
      },
      currency: 'USD',
      customerId: 'usr_1001',
    },
  }
}

export default handler
