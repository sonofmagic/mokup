export default (req) => {
  const rawId = req.params?.id ?? 'msg_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Message ${id}`
  const defaults = {
    fromId: 'usr_1001',
    toId: 'usr_1002',
    body: 'Hello!',
  }
  return {
    ok: true,
    data: {
      id,
      subject: displayValue,
      status: 'unread',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}
