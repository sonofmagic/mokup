export default (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'set_2001',
      key: 'Setting 2001',
      status: 'active',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      value: 'enabled',
      scope: 'org',
    },
  }
}
