import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `met_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      name: 'Metric 2001',
      status: 'ready',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      period: '30d',
      value: 1280,
      trend: 'up',
    },
  }
}

export default handler
