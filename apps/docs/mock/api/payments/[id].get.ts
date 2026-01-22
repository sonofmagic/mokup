import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'pay_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `PAY ${id}`
  const defaults = {
    amount: {
      amount: 120,
      currency: 'USD',
    },
    provider: 'stripe',
  }
  return {
    id,
    reference: displayValue,
    status: 'authorized',
    createdAt: faker.date.recent({ days: 90 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...defaults,
  }
}

export default handler
