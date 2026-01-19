export default (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'usr_2001',
      name: 'User 2001',
      status: 'active',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      email: 'user@example.com',
      role: 'member',
    },
  }
}
