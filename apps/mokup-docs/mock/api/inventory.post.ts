import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `inv_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      sku: 'SKU 2001',
      status: 'available',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      quantity: 120,
      location: 'wh-1',
    },
  }
}

export default handler
