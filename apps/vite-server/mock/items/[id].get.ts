import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'
import { defineHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const id = c.req.param('id') ?? faker.string.uuid()
  return {
    ok: true,
    item: {
      id,
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price({ min: 10, max: 200 })),
    },
  }
}

export default defineHandler(handler)
