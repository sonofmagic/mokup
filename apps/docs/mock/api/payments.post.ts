import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: 'pay_2001',
      reference: 'PAY 2001',
      status: 'authorized',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      amount: {
        amount: 120,
        currency: 'USD',
      },
      provider: 'stripe',
    },
  }
}

export default handler
