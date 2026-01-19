import type { DocsMockResponseHandler } from '../types'

const handler: DocsMockResponseHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: 'prd_2001',
      name: 'Product 2001',
      status: 'active',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      sku: 'SKU-1001',
      price: {
        amount: 49,
        currency: 'USD',
      },
      inventory: 120,
    },
  }
}

export default handler
