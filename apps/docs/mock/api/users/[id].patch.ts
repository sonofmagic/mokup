export default (req) => {
  const rawId = req.params?.id ?? 'usr_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `User ${id}`
  const defaults = {
    email: 'user@example.com',
    role: 'member',
  }
  return {
    ok: true,
    data: {
      id,
      name: displayValue,
      status: 'active',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}
