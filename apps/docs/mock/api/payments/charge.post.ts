import type { DocsMockResponseHandler } from '../../types'

const handler: DocsMockResponseHandler = (req, res) => {
  const rawFail = req.query?.fail ?? req.body?.fail
  const failValue = Array.isArray(rawFail) ? rawFail[0] : rawFail
  if (failValue === '1' || failValue === 'true' || failValue === true) {
    res.statusCode = 402
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
