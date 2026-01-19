export default (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'crt_2001',
      name: 'Cart 2001',
      status: 'open',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      subtotal: {
        amount: 120,
        currency: 'USD',
      },
      itemCount: 3,
      currency: 'USD',
    },
  }
}
