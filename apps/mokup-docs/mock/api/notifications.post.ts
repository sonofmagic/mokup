import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `not_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      title: 'Notification 2001',
      status: 'unread',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      type: 'system',
      read: false,
      channel: 'email',
    },
  }
}

export default handler
