import type { RequestHandler, RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = async (c) => {
  await new Promise(resolve => setTimeout(resolve, 150))
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  const username = (body as { username?: string }).username
  const password = (body as { password?: string }).password
  if (username === 'mokup' && password === '123456') {
    return {
      ok: true,
      message: faker.lorem.sentence(),
      token: faker.string.alphanumeric({ length: 18, casing: 'lower' }),
    }
  }
  c.status(401)
  return {
    ok: false,
    message: faker.lorem.sentence(),
    hint: `Try ${faker.helpers.arrayElement(['mokup', 'demo'])} / 123456`,
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
