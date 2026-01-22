import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'set_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Setting ${id}`
  const defaults = {
    value: 'enabled',
    scope: 'org',
  }
  return {
    ok: true,
    data: {
      id,
      key: displayValue,
      status: 'active',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      ...defaults,
    },
  }
}

export default handler
