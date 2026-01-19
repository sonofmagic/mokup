export default (_req, res) => {
  res.statusCode = 201
  return {
    ok: true,
    data: {
      id: 'pst_2001',
      title: 'Post 2001',
      status: 'published',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      authorId: 'usr_1001',
      content: 'Sample post content',
      likes: 12,
    },
  }
}
