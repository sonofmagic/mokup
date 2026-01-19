export default (req) => {
  const rawId = req.params?.id ?? 'pst_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Post ${id}`
  const defaults = {
    authorId: 'usr_1001',
    content: 'Sample post content',
    likes: 12,
  }
  return {
    ok: true,
    data: {
      id,
      title: displayValue,
      status: 'published',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}
