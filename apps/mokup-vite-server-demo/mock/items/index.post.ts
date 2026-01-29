import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'
import { defineHandler } from 'mokup'

const handler: RequestHandler = async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  const name = (body as { name?: string }).name ?? faker.commerce.productName()
  return {
    ok: true,
    item: {
      id: faker.string.uuid(),
      name,
      price: Number(faker.commerce.price({ min: 10, max: 200 })),
    },
  }
}

export default defineHandler({
  status: 201,
  handler,
})
