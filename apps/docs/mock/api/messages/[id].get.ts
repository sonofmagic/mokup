import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'msg_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Message ${id}`
  const defaults = {
    fromId: 'usr_1001',
    toId: 'usr_1002',
    body: 'Hello!',
  }
  return {
    id,
    subject: displayValue,
    status: 'unread',
    createdAt: faker.date.recent({ days: 90 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...defaults,
  }
}

export default handler
