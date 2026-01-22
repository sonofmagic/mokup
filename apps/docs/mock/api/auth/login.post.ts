import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  const username = (body as { username?: string }).username
  const password = (body as { password?: string }).password
  if (username !== 'demo' || password !== 'mokup') {
    c.status(401)
    return {
      ok: false,
      error: 'invalid_credentials',
      requestId: faker.string.uuid(),
    }
  }
  return {
    token: faker.string.alphanumeric({ length: 24, casing: 'lower' }),
    expiresIn: faker.number.int({ min: 900, max: 7200 }),
    requestId: faker.string.uuid(),
    user: {
      id: `usr_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
  }
}

export default handler
