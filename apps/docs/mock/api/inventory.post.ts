import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: 'inv_2001',
      sku: 'SKU 2001',
      status: 'available',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      quantity: 120,
      location: 'wh-1',
    },
  }
}

export default handler
