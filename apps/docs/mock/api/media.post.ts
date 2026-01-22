import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: `med_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      name: 'Media 2001',
      status: 'ready',
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      type: 'image',
      url: 'https://cdn.example.com/media.png',
      size: 2048,
    },
  }
}

export default handler
