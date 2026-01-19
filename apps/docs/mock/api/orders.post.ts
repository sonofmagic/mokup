export default (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'ord_2001',
      number: 'ORD 2001',
      status: 'processing',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      total: {
        amount: 240,
        currency: 'USD',
      },
      currency: 'USD',
      customerId: 'usr_1001',
    },
  }
}
