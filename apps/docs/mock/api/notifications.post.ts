export default (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'not_2001',
      title: 'Notification 2001',
      status: 'unread',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      type: 'system',
      read: false,
      channel: 'email',
    },
  }
}
