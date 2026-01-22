import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'usr_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `User ${id}`
  const defaults = {
    email: 'user@example.com',
    role: 'member',
  }
  return {
    ok: true,
    data: {
      id,
      name: displayValue,
      status: 'active',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      ...defaults,
    },
  }
}

export default handler
