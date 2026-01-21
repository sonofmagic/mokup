import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: 'bil_2001',
      name: 'Billing Account 2001',
      status: 'active',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      plan: 'pro',
      balance: {
        amount: 120,
        currency: 'USD',
      },
      currency: 'USD',
    },
  }
}

export default handler
