import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'ord_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `ORD ${id}`
  const defaults = {
    total: {
      amount: 240,
      currency: 'USD',
    },
    currency: 'USD',
    customerId: 'usr_1001',
  }
  return {
    id,
    number: displayValue,
    status: 'processing',
    createdAt: faker.date.recent({ days: 90 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...defaults,
  }
}

export default handler
