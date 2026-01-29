import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'
import { defineHandler } from 'mokup'

const handler: RequestHandler = async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  const username = (body as { username?: string }).username ?? 'guest'

  return {
    ok: true,
    token: faker.string.alphanumeric({ length: 20, casing: 'lower' }),
    user: {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
    received: {
      username,
    },
  }
}

const rule = {
  handler,
}

export default defineHandler(rule)
