export default (req) => {
  const rawId = req.params?.id ?? 'pro_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Profile ${id}`
  const defaults = {
    bio: 'Hello there.',
    avatarUrl: 'https://cdn.example.com/avatar.png',
  }
  return {
    ok: true,
    data: {
      id,
      displayName: displayValue,
      status: 'active',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}
