import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'not_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Notification ${id}`
  const defaults = {
    type: 'system',
    read: false,
    channel: 'email',
  }
  return {
    id,
    title: displayValue,
    status: 'unread',
    createdAt: faker.date.recent({ days: 90 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...defaults,
  }
}

export default handler
