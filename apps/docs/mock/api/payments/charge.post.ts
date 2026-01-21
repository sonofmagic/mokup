import type { RequestHandler } from 'mokup'

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
    }
  }
  return {
    ok: true,
    paymentId: 'pay_2001',
    status: 'authorized',
    amount: { amount: 120, currency: 'USD' },
  }
}

export default handler
