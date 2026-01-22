import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `prd_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      name: 'Product 2001',
      status: 'active',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      sku: 'SKU-1001',
      price: {
        amount: 49,
        currency: 'USD',
      },
      inventory: 120,
    },
  }
}

export default handler
