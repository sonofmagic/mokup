export default (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'org_2001',
      name: 'Org 2001',
      status: 'active',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      domain: 'example.com',
      plan: 'pro',
      membersCount: 12,
    },
  }
}
