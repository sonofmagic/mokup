import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `shp_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      tracking: 'TRK 2001',
      status: 'in_transit',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      carrier: 'DHL',
      eta: '2026-01-22',
    },
  }
}

export default handler
