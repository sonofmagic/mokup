import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `msg_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      subject: 'Message 2001',
      status: 'unread',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      fromId: 'usr_1001',
      toId: 'usr_1002',
      body: 'Hello!',
    },
  }
}

export default handler
