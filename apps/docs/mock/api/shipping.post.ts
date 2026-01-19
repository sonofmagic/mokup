export default (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'shp_2001',
      tracking: 'TRK 2001',
      status: 'in_transit',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      carrier: 'DHL',
      eta: '2026-01-22',
    },
  }
}
