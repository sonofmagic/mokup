export default (req) => {
  const rawId = req.params?.id ?? 'set_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Setting ${id}`
  const defaults = {
    value: 'enabled',
    scope: 'org',
  }
  return {
    id,
    key: displayValue,
    status: 'active',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}
