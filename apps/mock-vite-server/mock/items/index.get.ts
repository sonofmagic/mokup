import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'
import { defineHandler } from 'mokup'

const handler: RequestHandler = () => {
  const items = faker.helpers.multiple(() => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    price: Number(faker.commerce.price({ min: 10, max: 200 })),
  }), { count: 3 })
  return {
    ok: true,
    items,
    count: items.length,
  }
}

export default defineHandler(handler)
