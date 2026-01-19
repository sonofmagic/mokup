export default (req) => {
  const rawId = req.params?.id ?? 'org_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Org ${id}`
  const defaults = {
    domain: 'example.com',
    plan: 'pro',
    membersCount: 12,
  }
  return {
    id,
    name: displayValue,
    status: 'active',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}
