import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'med_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Media ${id}`
  const defaults = {
    type: 'image',
    url: 'https://cdn.example.com/media.png',
    size: 2048,
  }
  return {
    ok: true,
    data: {
      id,
      name: displayValue,
      status: 'ready',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      ...defaults,
    },
  }
}

export default handler
