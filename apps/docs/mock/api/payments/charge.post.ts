import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  const rawFail = c.req.query('fail') ?? (body as { fail?: unknown }).fail
  const failValue = Array.isArray(rawFail) ? rawFail[0] : rawFail
  if (failValue === '1' || failValue === 'true' || failValue === true) {
    c.status(402)
    return {
      ok: false,
      error: 'payment_required',
      requestId: faker.string.uuid(),
    }
  }
  return {
    ok: true,
    paymentId: `pay_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
    status: faker.helpers.arrayElement(['authorized', 'captured', 'pending']),
    amount: {
      amount: faker.number.int({ min: 20, max: 2000 }),
      currency: faker.finance.currencyCode(),
    },
    requestId: faker.string.uuid(),
  }
}

export default handler
