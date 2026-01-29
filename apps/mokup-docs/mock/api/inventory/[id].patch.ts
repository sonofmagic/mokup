import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'inv_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `SKU ${id}`
  const defaults = {
    quantity: 120,
    location: 'wh-1',
  }
  return {
    ok: true,
    data: {
      id,
      sku: displayValue,
      status: 'available',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      ...defaults,
    },
  }
}

export default handler
